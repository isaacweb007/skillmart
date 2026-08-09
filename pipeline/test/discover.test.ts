import { describe, expect, it } from "vitest";
import { interleaveByRepo, isSkillMdPath } from "../src/github/discover.js";

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

describe("interleaveByRepo", () => {
  const mega = { repo: "mega", paths: Array.from({ length: 200 }, (_, i) => `m/${i}/SKILL.md`) };
  const small = [
    { repo: "a", paths: ["a/SKILL.md"] },
    { repo: "b", paths: ["b/SKILL.md"] },
    { repo: "c", paths: ["c/SKILL.md"] },
  ];

  it("메가레포가 예산을 독점하지 못한다", () => {
    const out = interleaveByRepo([mega, ...small], 4);
    expect(out.map((o) => o.repo)).toEqual(["mega", "a", "b", "c"]);
  });

  it("작은 저장소가 소진되면 남은 예산은 깊은 저장소가 채운다", () => {
    const out = interleaveByRepo([mega, ...small], 8);
    expect(out.filter((o) => o.repo === "mega")).toHaveLength(5); // 라운드 0~4
    expect(out.filter((o) => o.repo !== "mega")).toHaveLength(3);
  });

  it("max를 넘지 않는다", () => {
    expect(interleaveByRepo([mega], 7)).toHaveLength(7);
  });

  it("전체가 max보다 적으면 전부 담는다", () => {
    const out = interleaveByRepo(small, 100);
    expect(out).toHaveLength(3);
  });

  it("빈 입력에서 무한 루프에 빠지지 않는다", () => {
    expect(interleaveByRepo([], 10)).toEqual([]);
    expect(interleaveByRepo([{ repo: "x", paths: [] }], 10)).toEqual([]);
  });
});
