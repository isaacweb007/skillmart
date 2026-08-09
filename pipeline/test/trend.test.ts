import { describe, expect, it } from "vitest";
import { trendingDelta } from "../src/lib/trend.js";

const TODAY = "2026-08-09";

describe("trendingDelta", () => {
  it("7일 이전의 가장 최근 스냅샷과의 차이를 돌려준다", () => {
    const snaps = [
      { date: "2026-08-01", stars: 100 }, // 8일 전 — 기준
      { date: "2026-08-05", stars: 120 }, // 7일 이내 — 무시
    ];
    expect(trendingDelta(snaps, 150, TODAY)).toBe(50);
  });
  it("정확히 7일 전 스냅샷도 기준이 된다", () => {
    expect(trendingDelta([{ date: "2026-08-02", stars: 90 }], 100, TODAY)).toBe(10);
  });
  it("7일 이전 스냅샷이 없으면 0", () => {
    expect(trendingDelta([{ date: "2026-08-08", stars: 10 }], 50, TODAY)).toBe(0);
    expect(trendingDelta([], 50, TODAY)).toBe(0);
  });
  it("감소하면 음수를 그대로 돌려준다 (노출 필터는 웹에서)", () => {
    expect(trendingDelta([{ date: "2026-08-01", stars: 100 }], 80, TODAY)).toBe(-20);
  });
});
