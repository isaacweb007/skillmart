import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export const SITE_URL = "https://skillmart.dev";

const abs = (locale: string, path: string) => `${SITE_URL}/${locale}${path}`;

/** 로케일 제외 경로("" | "/skills" | `/skills/${slug}` …)를 받아
 *  자기 canonical + 3개 언어 + x-default(ko) 절대 URL 세트를 만든다 */
export function pageAlternates(
  locale: string,
  path: string,
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: abs(locale, path),
    languages: sitemapLanguages(path),
  };
}

/** hreflang 맵 (페이지 alternates.languages와 sitemap 항목이 공유) */
export function sitemapLanguages(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((l) => [l, abs(l, path)])),
    "x-default": abs("ko", path),
  };
}
