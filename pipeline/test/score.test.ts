import { describe, expect, it } from "vitest";
import { isVisible, needsAnalysis, nextStatus, rankScore } from "../src/lib/score.js";

const NOW = new Date("2026-08-09T00:00:00Z");

describe("rankScore", () => {
  it("공식 공식: 0.5*품질 + 0.3*인기 + 0.2*최신성", () => {
    // ai 10점, stars 9999(log10(10000)/4 = 1), 오늘 커밋 → 1.0
    expect(rankScore(10, 9999, "2026-08-09T00:00:00Z", NOW)).toBe(1);
  });
  it("ai_score가 null이면 품질 0으로 계산한다", () => {
    // stars 0, 커밋 없음 → 0
    expect(rankScore(null, 0, null, NOW)).toBe(0);
  });
  it("최신성은 180일에 걸쳐 선형 감쇠한다", () => {
    // 90일 전 → recency 0.5 → 0.2*0.5 = 0.1
    expect(rankScore(null, 0, "2026-05-11T00:00:00Z", NOW)).toBeCloseTo(0.1, 3);
  });
  it("180일 넘으면 최신성 0", () => {
    expect(rankScore(null, 0, "2024-01-01T00:00:00Z", NOW)).toBe(0);
  });
});

describe("isVisible", () => {
  it("5점 이상이면 노출", () => {
    expect(isVisible(5, false)).toBe(true);
    expect(isVisible(4, false)).toBe(false);
  });
  it("공식 저장소는 점수 무관 노출", () => {
    expect(isVisible(0, true)).toBe(true);
    expect(isVisible(null, true)).toBe(true);
  });
  it("점수 없고 비공식이면 미노출", () => {
    expect(isVisible(null, false)).toBe(false);
  });
});

describe("needsAnalysis", () => {
  it("신규는 분석 대상", () => {
    expect(needsAnalysis(undefined, "h1")).toBe(true);
  });
  it("해시가 바뀌면 분석 대상", () => {
    expect(needsAnalysis({ content_hash: "h1", status: "visible" }, "h2")).toBe(true);
  });
  it("해시 동일 + pending_analysis면 재시도 대상", () => {
    expect(needsAnalysis({ content_hash: "h1", status: "pending_analysis" }, "h1")).toBe(true);
  });
  it("해시 동일 + visible이면 생략", () => {
    expect(needsAnalysis({ content_hash: "h1", status: "visible" }, "h1")).toBe(false);
  });
});

describe("nextStatus", () => {
  it("분석 성공 + 게이트 통과 → visible, 시도 횟수 리셋", () => {
    expect(nextStatus(true, 7, false, 2)).toEqual({ status: "visible", attempts: 0 });
  });
  it("분석 성공 + 게이트 미달 → hidden", () => {
    expect(nextStatus(true, 3, false, 0)).toEqual({ status: "hidden", attempts: 0 });
  });
  it("분석 실패 1~2회 → pending_analysis, 횟수 증가", () => {
    expect(nextStatus(false, null, false, 0)).toEqual({ status: "pending_analysis", attempts: 1 });
    expect(nextStatus(false, null, false, 1)).toEqual({ status: "pending_analysis", attempts: 2 });
  });
  it("분석 3회 연속 실패 → failed", () => {
    expect(nextStatus(false, null, false, 2)).toEqual({ status: "failed", attempts: 3 });
  });
});
