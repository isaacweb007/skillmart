import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { CATEGORIES } from "@/lib/categories";
import { getAllVisibleForSitemap, getCollections } from "@/lib/db";
import { SITE_URL, sitemapLanguages } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 컬렉션 locale 인자는 제목 선택용일 뿐 — slug·visible 필터는 locale 무관이라 ko로 고정
  const [skills, collections] = await Promise.all([
    getAllVisibleForSitemap(),
    getCollections("ko"),
  ]);

  const entries: MetadataRoute.Sitemap = [];
  const add = (path: string, lastModified?: Date) => {
    const languages = sitemapLanguages(path);
    for (const l of routing.locales) {
      entries.push({ url: `${SITE_URL}/${l}${path}`, lastModified, alternates: { languages } });
    }
  };

  add("");
  add("/skills");
  add("/guide");
  // 코너 12개 — 검색 유입 경로. 코너만 지정된 URL은 자기 canonical을 가진다(skills/page.tsx)
  for (const c of CATEGORIES) add(`/skills?category=${c}`);
  for (const s of skills) add(`/skills/${s.slug}`, new Date(s.updated_at));
  for (const c of collections) add(`/collections/${c.slug}`);
  return entries;
}
