import { describe, expect, it } from "vitest";
import {
  FILTER,
  guessCategory,
  parseDuration,
  passesFilter,
  matchesLocale,
  mentionsClaude,
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
    hasCaption: false,
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

describe("matchesLocale", () => {
  it("ko는 한글 제목만 통과", () => {
    expect(matchesLocale("클로드 스킬 완전정복", "ko")).toBe(true);
    expect(matchesLocale("Build Websites using Claude Code", "ko")).toBe(false);
  });
  it("vi는 베트남 전용 문자가 있어야 통과", () => {
    expect(matchesLocale("Claude AI Tự Làm Video 3D Từ A-Z", "vi")).toBe(true);
    expect(matchesLocale("Dieser Claude Code Skill ist GENIAL!", "vi")).toBe(false);
  });
  it("en은 한글·일본어·키릴이 없어야 통과", () => {
    expect(matchesLocale("Claude Code Skills Beat Superpowers", "en")).toBe(true);
    expect(matchesLocale("Skills機能を世界一わかりやすく解説してみた", "en")).toBe(false);
    expect(matchesLocale("클로드 스킬 사용법", "en")).toBe(false);
    expect(matchesLocale("Anthropic vừa mở kho Agent Skills", "en")).toBe(false);
  });
  it("공용 발음부호(café·José)는 베트남어로 오판하지 않는다", () => {
    expect(matchesLocale("Claude Skills for café owners", "en")).toBe(true);
    expect(matchesLocale("Claude Skills for café owners", "vi")).toBe(false);
  });
});

describe("passesFilter 언어·길이 경계", () => {
  it("locale을 주면 언어가 안 맞는 영상은 탈락", () => {
    const en = candidate({ title: "Claude Code Skill Guide" });
    expect(passesFilter(en, NOW, "en")).toBe(true);
    expect(passesFilter(en, NOW, "ko")).toBe(false);
  });
  it("1시간 초과는 탈락 (라이브 아카이브 제외)", () => {
    expect(passesFilter(candidate({ durationIso: "PT2H32M" }), NOW)).toBe(false);
  });
});

describe("mentionsClaude", () => {
  it("Claude·클로드가 있으면 통과", () => {
    expect(mentionsClaude("Claude Code Skill Guide")).toBe(true);
    expect(mentionsClaude("클로드 스킬 사용법")).toBe(true);
  });
  it("타사·무관 영상은 탈락", () => {
    expect(mentionsClaude("Cách Dùng Skill ChatGPT Work tạo ảnh")).toBe(false);
    expect(mentionsClaude("AI로 월 500만원 버는 법")).toBe(false);
  });
  it("passesFilter에도 반영된다", () => {
    expect(passesFilter(candidate({ title: "ChatGPT Skill 사용법" }), NOW, "ko")).toBe(false);
  });
});

describe("selectTop 정렬 기준", () => {
  it("자막 여부와 무관하게 조회수 순 — 자막이 순위를 왜곡하지 않는다", () => {
    const list = [
      candidate({ videoId: "capLow", views: 348, hasCaption: true }),
      candidate({ videoId: "noCapHigh", views: 98434, hasCaption: false }),
    ];
    expect(selectTop(list, 2).map((c) => c.videoId)).toEqual(["noCapHigh", "capLow"]);
  });
  it("자막이 하나도 없어도 10개를 채운다", () => {
    const list = Array.from({ length: 14 }, (_, i) =>
      candidate({ videoId: `v${i}`, views: 1000 - i, hasCaption: false }),
    );
    expect(selectTop(list, 10)).toHaveLength(10);
  });
});
