import { describe, expect, it } from "vitest";
import {
  buildCollectionsPrompt,
  COLLECTIONS_SCHEMA,
  validateCollections,
} from "../src/claude/collections.js";

const SKILLS = [
  { slug: "pptx", name: "PPTX", category: "docs-office", one_liner: "Make decks" },
  { slug: "docx", name: "DOCX", category: "docs-office", one_liner: "Write docs" },
  { slug: "pdf", name: "PDF", category: "docs-office", one_liner: "Read PDFs" },
];

describe("COLLECTIONS_SCHEMA", () => {
  it("구조화 출력 규칙을 지킨다", () => {
    expect(COLLECTIONS_SCHEMA.additionalProperties).toBe(false);
    const item = COLLECTIONS_SCHEMA.properties.collections.items;
    expect(item.required).toEqual(["slug", "skill_slugs", "translations"]);
    expect(item.properties.translations.required).toEqual(["ko", "vi", "en"]);
  });
});

describe("buildCollectionsPrompt", () => {
  it("스킬 카탈로그를 담는다", () => {
    const p = buildCollectionsPrompt(SKILLS);
    expect(p).toContain("pptx");
    expect(p).toContain("Make decks");
  });
});

describe("validateCollections", () => {
  const t = { ko: { title: "ㄱ", description: "ㄴ" }, vi: { title: "a", description: "b" }, en: { title: "c", description: "d" } };
  it("존재하지 않는 slug를 걸러내고, 3개 미만이 되면 세트를 폐기한다", () => {
    const out = validateCollections(
      [
        { slug: "office", skill_slugs: ["pptx", "docx", "pdf", "ghost"], translations: t },
        { slug: "tiny", skill_slugs: ["pptx", "ghost1", "ghost2"], translations: t },
      ],
      new Set(["pptx", "docx", "pdf"]),
    );
    expect(out).toHaveLength(1);
    expect(out[0].skill_slugs).toEqual(["pptx", "docx", "pdf"]);
  });
});
