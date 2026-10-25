"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** 이 사이트의 진짜 전환은 '복사'다 — 복사 성공 시 GA4 이벤트 하나를 쏜다.
 *  페이지 경로는 GA가 자동으로 붙이므로 무엇을 복사했는지(item_id)만 보낸다.
 *  GA 미탑재·광고차단이면 gtag가 없고, 그 경우 조용히 아무 일도 안 한다. */
export function trackCopy(label: string) {
  // GA4 파라미터 값 상한(100자) 안에서 식별 가능한 머리만 보낸다
  window.gtag?.("event", "copy", { item_id: label.slice(0, 80) });
}
