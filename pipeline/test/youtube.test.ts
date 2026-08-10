import { describe, expect, it } from "vitest";
import {
  FILTER,
  guessCategory,
  parseDuration,
  passesFilter,
  selectTop,
  type RawCandidate,
} from "../src/youtube/search.js";

const NOW = new Date("2026-08-10T00:00:00Z");

function candidate(over: Partial<RawCandidate> = {}): RawCandidate {
  return {
    videoId: "abc",
    title: "Claude 스킬 튜토리얼",
    channelTitle: "채널",
    thumbnailUrl: "https://i.ytimg.com/vi/abc/mqdefault.jpg",
    publishedAt: "2026-08-08T00:00:00Z",
    views: 1000,
    durationIso: "PT8M30S",
    ...over,
  };
}

describe("parseDuration", () => {
  it("시·분·초를 초로 바꾼다", () => {
    expect(parseDuration("PT1H2M3S")).toBe(3723);
    expect(parseDuration("PT8M30S")).toBe(510);
    expect(parseDuration("PT45S")).toBe(45);
  });
  it("파싱 불가는 0 — 필터에서 탈락한다", () => {
    expect(parseDuration("")).toBe(0);
    expect(parseDuration("8분")).toBe(0);
  });
});

describe("passesFilter", () => {
  it("정상 후보는 통과", () => {
    expect(passesFilter(candidate(), NOW)).toBe(true);
  });
  it("오래된 영상은 탈락", () => {
    expect(passesFilter(candidate({ publishedAt: "2026-07-01T00:00:00Z" }), NOW)).toBe(false);
  });
  it("조회수 미달은 탈락", () => {
    expect(passesFilter(candidate({ views: FILTER.minViews - 1 }), NOW)).toBe(false);
  });
  it("2분 미만 쇼츠는 탈락", () => {
    expect(passesFilter(candidate({ durationIso: "PT59S" }), NOW)).toBe(false);
  });
  it("미래 날짜는 탈락 (잘못된 데이터 방어)", () => {
    expect(passesFilter(candidate({ publishedAt: "2026-09-01T00:00:00Z" }), NOW)).toBe(false);
  });
});

describe("selectTop", () => {
  it("조회수 내림차순 상위 n개", () => {
    const list = [
      candidate({ videoId: "a", views: 10 }),
      candidate({ videoId: "b", views: 300 }),
      candidate({ videoId: "c", views: 50 }),
    ];
    expect(selectTop(list, 2).map((c) => c.videoId)).toEqual(["b", "c"]);
  });
  it("여러 검색어에 걸린 같은 영상은 한 번만 담는다", () => {
    const dup = [candidate({ videoId: "x" }), candidate({ videoId: "x" })];
    expect(selectTop(dup, 9)).toHaveLength(1);
  });
});

describe("guessCategory", () => {
  it("제목 키워드로 코너를 찾는다", () => {
    expect(guessCategory("Claude로 PPT 만들기")).toBe("docs-office");
    expect(guessCategory("코드 리뷰 자동화")).toBe("dev-coding");
  });
  it("대소문자를 가리지 않는다", () => {
    expect(guessCategory("Excel automation with Claude")).toBe("docs-office");
  });
  it("단서가 없으면 null (표시에는 문제 없음)", () => {
    expect(guessCategory("오늘의 잡담")).toBeNull();
  });
});
