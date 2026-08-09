import { describe, expect, it } from "vitest";
import {
  ANALYSIS_SCHEMA,
  buildBatchRequest,
  CATEGORIES,
  costUsd,
  MODEL,
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
      "category", "tags", "difficulty", "ai_score", "install_command", "reviews", "translations",
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
