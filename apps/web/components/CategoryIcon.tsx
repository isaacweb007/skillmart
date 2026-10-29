/** 카테고리 12종의 16px 스트로크 아이콘.
 *  색은 currentColor — 유채색은 라벤더 하나라는 시스템 원칙(DESIGN.md)대로
 *  아이콘 자체는 ink 계열을 물려받고, active 칩에서만 흰색이 된다.
 *  1.5px 스트로크·라운드 캡, 24 뷰박스 — 한 손으로 그린 세트처럼 보이게 통일. */
const PATHS: Record<string, React.ReactNode> = {
  "docs-office": (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 12h7M9 16h7" />
    </>
  ),
  "dev-coding": <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13 4l-2 16" />,
  "design-ui": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18M12 7.5A4.5 4.5 0 0 1 12 16.5" />
    </>
  ),
  "marketing-seo": <path d="M3 11v3l4 1 5 5 2-1-2-5h3l6 2V5l-6 2H9L7 6 3 8zM17 9.5v5" />,
  "content-writing": <path d="m4 20 1-5L16 4l4 4L9 19zM13 7l4 4M4 20h7" />,
  "image-video": (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 16 5-5 4 4 3-3 6 6M9 9.5h.01" />
    </>
  ),
  "data-analytics": <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  "automation-workflow": (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" />
    </>
  ),
  "web-api": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18" />
    </>
  ),
  "security-review": <path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6zM9 12l2 2 4-4" />,
  education: <path d="m12 4 10 5-10 5L2 9zM6 11.5V17c2 2.5 10 2.5 12 0v-5.5M22 9v6" />,
  utility: <path d="M14.5 4.5a5 5 0 0 0-6.4 6.4L3 16l-1 4 4-1 5.1-5.1a5 5 0 0 0 6.4-6.4L14 11l-3-3z" />,
};

export default function CategoryIcon({ category, className = "h-4 w-4" }: { category: string; className?: string }) {
  const paths = PATHS[category];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {paths}
    </svg>
  );
}
