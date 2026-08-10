/** 안내 페이지의 온램프 표 — "지금 붙여넣으면 되는 문장" → "그걸 자동으로 하는 코너".
 *  범용 프롬프트 요령을 스킬 개념의 설명 장치로 쓴다: 매번 직접 쓰는 것 vs 알아서 되는 것.
 *  문장은 messages의 guide.onramp.s1~s8, 코너 이름은 categories.*를 재사용한다. */
export const ONRAMP = [
  { key: "s1", category: "docs-office" },
  { key: "s2", category: "dev-coding" },
  { key: "s3", category: "design-ui" },
  { key: "s4", category: "marketing-seo" },
  { key: "s5", category: "content-writing" },
  { key: "s6", category: "data-analytics" },
  { key: "s7", category: "automation-workflow" },
  { key: "s8", category: "education" },
] as const;
