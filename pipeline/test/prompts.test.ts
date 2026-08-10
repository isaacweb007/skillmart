import { describe, expect, it } from "vitest";
import {
  buildPromptsPrompt,
  DAILY_NEW,
  SEED_CMDS,
  validatePrompts,
  type GeneratedPrompt,
} from "../src/claude/prompts.js";

function prompt(over: Partial<GeneratedPrompt> = {}): GeneratedPrompt {
  return {
    cmd: "rubber-duck",
    category: "dev-coding",
    ko: { label: "설명하며 점검", example: "이 코드를 한 줄씩 설명해줘:" },
    vi: { label: "Giải thích từng dòng", example: "Giải thích từng dòng code này:" },
    en: { label: "Talk it through", example: "Walk me through this code line by line:" },
    ...over,
  };
}

describe("validatePrompts", () => {
  it("정상 항목은 통과", () => {
    expect(validatePrompts([prompt()], new Set())).toHaveLength(1);
  });

  it("기존 이름과 겹치면 버린다", () => {
    expect(validatePrompts([prompt({ cmd: "tldr" })], new Set(["tldr"]))).toHaveLength(0);
  });

  it("같은 응답 안의 중복도 하나만 남긴다", () => {
    const dup = [prompt({ cmd: "same" }), prompt({ cmd: "same" })];
    expect(validatePrompts(dup, new Set())).toHaveLength(1);
  });

  it("cmd 형식이 틀리면 버린다", () => {
    expect(validatePrompts([prompt({ cmd: "Bad Cmd" })], new Set())).toHaveLength(0);
    expect(validatePrompts([prompt({ cmd: "trailing-" })], new Set())).toHaveLength(0);
  });

  it("앞의 슬래시는 떼고 소문자로 정규화한다", () => {
    const out = validatePrompts([prompt({ cmd: "/Rubber-Duck" })], new Set());
    expect(out[0]?.cmd).toBe("rubber-duck");
  });

  it("어느 언어든 비어 있으면 버린다", () => {
    const bad = prompt({ vi: { label: "", example: "x" } });
    expect(validatePrompts([bad], new Set())).toHaveLength(0);
  });

  it("example이 슬래시 명령으로 시작하면 버린다 (붙여넣어도 작동하지 않는다)", () => {
    const bad = prompt({ en: { label: "x", example: "/rubber-duck explain this" } });
    expect(validatePrompts([bad], new Set())).toHaveLength(0);
  });

  it("하루 상한(DAILY_NEW)을 넘지 않는다", () => {
    const many = Array.from({ length: 10 }, (_, i) => prompt({ cmd: `new-${i}` }));
    expect(validatePrompts(many, new Set())).toHaveLength(DAILY_NEW);
  });
});

describe("buildPromptsPrompt", () => {
  it("제외 목록을 프롬프트에 실어 보낸다", () => {
    const text = buildPromptsPrompt(["tldr", "eli5"]);
    expect(text).toContain("tldr, eli5");
    expect(text).toContain(`새 문장 ${DAILY_NEW}개`);
  });
});

describe("SEED_CMDS", () => {
  it("웹 시드 40개와 개수가 맞다", () => {
    expect(SEED_CMDS).toHaveLength(40);
  });
  it("중복 없이 kebab-case다", () => {
    expect(new Set(SEED_CMDS).size).toBe(40);
    for (const c of SEED_CMDS) expect(c).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});
