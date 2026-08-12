import { describe, expect, it } from "vitest";
import {
  ANALYSIS_SCHEMA,
  buildBatchRequest,
  CATEGORIES,
  maxItemsForBudget,
  costUsd,
  MODEL,
  runAnalysisBatch,
} from "../src/claude/analyze.js";
import type { Candidate } from "../src/github/discover.js";

const CAND: Candidate = {
  repoFullName: "acme/skills",
  path: "pdf/SKILL.md",
  raw: "---\nname: pdf\ndescription: pdf tools\n---\n본문",
  stars: 10,
  forks: 1,
  lastCommitAt: "2026-08-01T00:00:00Z",
  license: "MIT",
  sourceUrl: "https://github.com/acme/skills/blob/main/pdf/SKILL.md",
  isOfficial: false,
};

describe("ANALYSIS_SCHEMA", () => {
  it("카테고리는 스펙의 12개 slug enum이다", () => {
    expect(CATEGORIES).toHaveLength(12);
    expect(ANALYSIS_SCHEMA.properties.category.enum).toEqual(CATEGORIES);
  });
  it("구조화 출력 규칙: additionalProperties false + 전 필드 required", () => {
    expect(ANALYSIS_SCHEMA.additionalProperties).toBe(false);
    expect(ANALYSIS_SCHEMA.required).toEqual([
      "category", "tags", "difficulty",
      "completeness_hits", "universality", "doc_hits", "risk",
      "install_command", "reviews", "translations",
    ]);
  });
  it("3개 로케일이 모두 required다", () => {
    expect(ANALYSIS_SCHEMA.properties.translations.required).toEqual(["ko", "vi", "en"]);
    expect(ANALYSIS_SCHEMA.properties.reviews.required).toEqual(["ko", "vi", "en"]);
  });
});

describe("buildBatchRequest", () => {
  it("claude-opus-5 + 구조화 출력 + SKILL.md 원문을 담는다", () => {
    const req = buildBatchRequest(CAND, "c0");
    expect(req.custom_id).toBe("c0");
    expect(req.params.model).toBe(MODEL);
    expect(req.params.output_config.format.type).toBe("json_schema");
    expect(req.params.messages[0].content).toContain("acme/skills");
    expect(req.params.messages[0].content).toContain("pdf tools");
  });
});

describe("costUsd", () => {
  it("Batch 요율($2.5/$12.5 per MTok)로 계산한다", () => {
    expect(costUsd(1_000_000, 1_000_000)).toBe(15);
    expect(costUsd(0, 0)).toBe(0);
  });
});

// --- runAnalysisBatch 스텁 헬퍼 (네트워크·타이머 없음: create/retrieve가 즉시 "ended"를 반환해 폴링 루프를 건너뛴다) ---

function succeededResult(
  text: string,
  opts?: { stopReason?: string; inputTokens?: number; outputTokens?: number },
) {
  return {
    type: "succeeded",
    message: {
      stop_reason: opts?.stopReason ?? "end_turn",
      usage: { input_tokens: opts?.inputTokens ?? 100, output_tokens: opts?.outputTokens ?? 50 },
      content: [{ type: "text", text }],
    },
  };
}

function erroredResult() {
  return { type: "errored", error: { type: "invalid_request_error", message: "실패" } };
}

function validAnalysisJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    category: "utility",
    tags: ["a", "b", "c", "d", "e", "f"], // 6개 — 5개 슬라이스 검증용
    difficulty: "beginner",
    completeness_hits: 9, // 범위 밖 — 4 클램프 검증용
    universality: 3,
    doc_hits: 3,
    risk: false,
    install_command: "git clone https://github.com/acme/skills ~/.claude/skills/pdf",
    reviews: { ko: "한줄평", vi: "Nhận xét", en: "One-line review" },
    translations: {
      ko: { name: "PDF 도구", one_liner: "PDF를 다룬다", description_md: "# 설명", install_guide_md: "1. 설치" },
      vi: { name: "Công cụ PDF", one_liner: "Xử lý PDF", description_md: "# Mô tả", install_guide_md: "1. Cài đặt" },
      en: { name: "PDF Tool", one_liner: "Handles PDFs", description_md: "# Description", install_guide_md: "1. Install" },
    },
    ...overrides,
  });
}

function fakeClient(entries: Array<{ custom_id: string; result: unknown }>, opts?: { createThrows?: boolean }) {
  return {
    messages: {
      batches: {
        create: async () => {
          if (opts?.createThrows) throw new Error("호출되면 안 됨");
          return { id: "b_test", processing_status: "ended", request_counts: { processing: 0 } };
        },
        retrieve: async () => ({ id: "b_test", processing_status: "ended", request_counts: { processing: 0 } }),
        results: async () => (async function* () { for (const e of entries) yield e; })(),
        cancel: async () => ({}),
      },
    },
  } as unknown as import("@anthropic-ai/sdk").default;
}

describe("runAnalysisBatch", () => {
  it("빈 요청이면 클라이언트를 호출하지 않고 빈 Map을 반환한다", async () => {
    const client = fakeClient([], { createThrows: true });
    const result = await runAnalysisBatch(client, []);
    expect(result.size).toBe(0);
  });

  it("succeeded + 유효 JSON: 충족 개수 합산(클램프 포함) → ai_score, tags 6개 → 5개 슬라이스, usage 토큰 기록", async () => {
    const requests = [buildBatchRequest(CAND, "c0")];
    const client = fakeClient([
      { custom_id: "c0", result: succeededResult(validAnalysisJson(), { inputTokens: 111, outputTokens: 222 }) },
    ]);
    const result = await runAnalysisBatch(client, requests);
    const outcome = result.get("c0");
    expect(outcome?.error).toBeUndefined();
    expect(outcome?.analysis?.ai_score).toBe(10); // clamp(9→4) + 3 + 3
    expect(outcome?.analysis?.tags).toHaveLength(5);
    expect(outcome?.inputTokens).toBe(111);
    expect(outcome?.outputTokens).toBe(222);
  });

  it("risk=true면 합산이 높아도 ai_score 2 상한 — 목록 노출(5점) 차단", async () => {
    const requests = [buildBatchRequest(CAND, "c0")];
    const client = fakeClient([
      { custom_id: "c0", result: succeededResult(validAnalysisJson({ risk: true })) },
    ]);
    const result = await runAnalysisBatch(client, requests);
    expect(result.get("c0")?.analysis?.ai_score).toBe(2);
  });

  it('succeeded + stop_reason "refusal": error "refusal" 기록, analysis 없음, usage는 기록', async () => {
    const requests = [buildBatchRequest(CAND, "c0")];
    const client = fakeClient([
      {
        custom_id: "c0",
        result: succeededResult(validAnalysisJson(), { stopReason: "refusal", inputTokens: 5, outputTokens: 1 }),
      },
    ]);
    const result = await runAnalysisBatch(client, requests);
    const outcome = result.get("c0");
    expect(outcome?.error).toBe("refusal");
    expect(outcome?.analysis).toBeUndefined();
    expect(outcome?.inputTokens).toBe(5);
    expect(outcome?.outputTokens).toBe(1);
  });

  it('result.type "errored": error "errored" 기록, 토큰 0', async () => {
    const requests = [buildBatchRequest(CAND, "c0")];
    const client = fakeClient([{ custom_id: "c0", result: erroredResult() }]);
    const result = await runAnalysisBatch(client, requests);
    const outcome = result.get("c0");
    expect(outcome?.error).toBe("errored");
    expect(outcome?.inputTokens).toBe(0);
    expect(outcome?.outputTokens).toBe(0);
  });

  it("succeeded + 채점 필드가 문자열인 JSON: error \"json_parse\" 기록, analysis 없음", async () => {
    const requests = [buildBatchRequest(CAND, "c0")];
    const client = fakeClient([
      { custom_id: "c0", result: succeededResult(validAnalysisJson({ completeness_hits: "many" })) },
    ]);
    const result = await runAnalysisBatch(client, requests);
    const outcome = result.get("c0");
    expect(outcome?.error).toBe("json_parse");
    expect(outcome?.analysis).toBeUndefined();
  });
});

describe("maxItemsForBudget", () => {
  it("실측 단가로 예산을 건수로 환산한다 ($3 → 41건)", () => {
    expect(maxItemsForBudget(3)).toBe(41); // floor(3 / 0.073)
  });
  it("단가보다 작은 예산도 최소 1건은 통과시킨다 (진행 불가 방지)", () => {
    expect(maxItemsForBudget(0.01)).toBe(1);
  });
  it("예산이 크면 비례해 늘어난다", () => {
    expect(maxItemsForBudget(30)).toBe(410);
  });
});
