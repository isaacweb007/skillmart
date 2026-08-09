import { describe, expect, it } from "vitest";
import { contentHash, makeSlug, parseSkillMd } from "../src/lib/skillmd.js";

const VALID = `---
name: pdf-tools
description: Use this when working with PDF files.
---
# 본문
`;

describe("parseSkillMd", () => {
  it("유효한 frontmatter에서 name/description을 뽑는다", () => {
    expect(parseSkillMd(VALID)).toEqual({
      name: "pdf-tools",
      description: "Use this when working with PDF files.",
    });
  });
  it("frontmatter가 없으면 null", () => {
    expect(parseSkillMd("# 그냥 마크다운")).toBeNull();
  });
  it("name이 없으면 null", () => {
    expect(parseSkillMd("---\ndescription: only desc\n---\n")).toBeNull();
  });
  it("YAML이 깨져도 throw하지 않고 null", () => {
    expect(parseSkillMd("---\nname: [broken\n---\n")).toBeNull();
  });
});

describe("contentHash", () => {
  it("같은 입력은 같은 해시, 다른 입력은 다른 해시", () => {
    expect(contentHash("a")).toBe(contentHash("a"));
    expect(contentHash("a")).not.toBe(contentHash("b"));
    expect(contentHash("a")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("makeSlug", () => {
  it("이름을 소문자-하이픈 슬러그로 만든다", () => {
    expect(makeSlug("PDF Tools!", "owner/repo", new Set())).toBe("pdf-tools");
  });
  it("충돌 시 owner를 접두한다", () => {
    expect(makeSlug("pdf-tools", "acme/repo", new Set(["pdf-tools"]))).toBe("acme-pdf-tools");
  });
  it("그래도 충돌하면 숫자를 붙인다", () => {
    expect(
      makeSlug("pdf-tools", "acme/repo", new Set(["pdf-tools", "acme-pdf-tools"])),
    ).toBe("acme-pdf-tools-2");
  });
});
