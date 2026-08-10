import { SITE_URL } from "./site";

/** 스크립트 태그 탈출 방지 — `<`를 유니코드 이스케이프한다 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumb(items: { name: string; path: string }[], locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}/${locale}${it.path}`,
    })),
  };
}

/** 스킬은 GitHub의 코드 자원이다.
 *  ponytail: 사용자 평점이 없으므로 aggregateRating·ratingValue는 넣지 않는다 —
 *  자체 AI 점수를 별점으로 표기하면 구글 구조화 데이터 정책 위반이다. */
export function softwareSourceCode(input: {
  name: string;
  description: string;
  url: string;
  codeRepository: string;
  license: string | null;
  locale: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: input.name,
    description: input.description,
    url: input.url,
    codeRepository: input.codeRepository,
    inLanguage: input.locale,
    ...(input.license ? { license: input.license } : {}),
  };
}

export function webSite(name: string, description: string, locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    description,
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale,
  };
}
