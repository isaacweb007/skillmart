import { describe, expect, it } from "vitest";
import { isSkillMdPath } from "../src/github/discover.js";

describe("isSkillMdPath", () => {
  it("루트와 하위 경로의 SKILL.md를 잡는다", () => {
    expect(isSkillMdPath("SKILL.md")).toBe(true);
    expect(isSkillMdPath("skills/pdf/SKILL.md")).toBe(true);
    expect(isSkillMdPath("a/b/skill.md")).toBe(true); // 대소문자 무시
  });
  it("다른 파일은 거른다", () => {
    expect(isSkillMdPath("README.md")).toBe(false);
    expect(isSkillMdPath("MYSKILL.md")).toBe(false);
    expect(isSkillMdPath("SKILL.md.bak")).toBe(false);
  });
});
