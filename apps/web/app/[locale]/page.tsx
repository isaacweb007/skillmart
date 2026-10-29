import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CategoryIcon from "@/components/CategoryIcon";
import SearchBar from "@/components/SearchBar";
import SkillCard from "@/components/SkillCard";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/categories";
import { categoryCounts, getCollections, getHomeSkills, getTrendingSkills, getVisibleCount } from "@/lib/db";
import { jsonLd, webSite } from "@/lib/jsonld";
import { PROMPTS } from "@/lib/prompts";
import { pageAlternates } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: { absolute: t("seo.homeTitle") },
    description: t("seo.homeDesc"),
    alternates: pageAlternates(locale, ""),
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [count, { top, fresh }, trending, collections, counts] = await Promise.all([
    getVisibleCount(),
    getHomeSkills(locale),
    getTrendingSkills(locale),
    getCollections(locale),
    categoryCounts(locale),
  ]);

  return (
    <div className="py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(webSite(t("brand"), t("seo.homeDesc"), locale)),
        }}
      />
      {/* Linear의 히어로는 크고 자간이 좁다 — 80px에서 -3px, 즉 크기의 약 4% */}
      <section className="mb-16 pt-8 text-center sm:pt-14">
        <h1 className="mx-auto mb-5 max-w-3xl font-display text-4xl font-semibold text-balance sm:text-5xl md:text-6xl">
          {t("home.heroTitle")}
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-base text-ink-subtle sm:text-lg">
          {t("home.heroSubtitle", { count })}
        </p>
        <div className="mx-auto max-w-xl">
          <SearchBar locale={locale} />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl font-semibold">{t("home.corners")}</h2>
        {/* 코너 = 이 마트의 매대 배치도. 칩 한 줄이 아니라 들어가 볼 수 있는 입구로 보여준다 */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/skills?category=${c}`}
              className="group flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              <CategoryIcon category={c} className="h-4 w-4 text-ink-soft group-hover:text-ink" />
              <span className="min-w-0 truncate text-sm">{t(`categories.${c}`)}</span>
              <span className="ml-auto text-xs text-ink-tertiary">{counts[c] ?? 0}</span>
            </Link>
          ))}
        </div>
        <div className="mt-3">
          <Link href="/skills?difficulty=beginner" className="text-sm text-accent underline">
            {t("list.easyTitle")} →
          </Link>
        </div>
      </section>

      {/* 설치 전에 얻는 가치 — 첫 방문자가 여기서 바로 써본다 */}
      <section className="mb-12 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-2 font-display text-xl font-semibold">{t("prompts.homeTitle")}</h2>
        <p className="mb-4 text-sm leading-relaxed text-ink-soft">{t("prompts.lead")}</p>
        <div className="mb-4 space-y-2">
          {PROMPTS.slice(0, 4).map((p) => {
            const text = locale === "vi" ? p.vi : locale === "en" ? p.en : p.ko;
            return (
              <p
                key={p.cmd}
                className="rounded-lg border border-line bg-bg p-3 font-mono-plex text-xs leading-relaxed"
              >
                {text.example}
              </p>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/prompts" className="text-sm font-semibold text-accent underline">
            {t("prompts.homeMore")} →
          </Link>
          <Link href="/image-prompts" className="text-sm font-semibold text-accent underline">
            {t("imagePrompts.fromPrompts")} →
          </Link>
        </div>
      </section>

      {collections.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 font-display text-xl font-semibold">{t("home.collections")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="group block rounded-xl border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong hover:bg-surface-2"
              >
                <h3 className="mb-1 font-display text-lg font-semibold group-hover:text-accent">{c.title}</h3>
                <p className="mb-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{c.description}</p>
                <span className="text-xs text-accent">{t("collection.skillCount", { count: c.count })} →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <HomeSection
          title={t("home.trending")}
          viewAll={t("home.viewAll")}
          href="/skills?sort=trending"
          skills={trending}
        />
      )}

      <HomeSection title={t("home.top")} viewAll={t("home.viewAll")} href="/skills?sort=rank" skills={top} />
      <HomeSection title={t("home.fresh")} viewAll={t("home.viewAll")} href="/skills?sort=new" skills={fresh} />
    </div>
  );
}

function HomeSection({
  title,
  viewAll,
  href,
  skills,
}: {
  title: string;
  viewAll: string;
  href: string;
  skills: Awaited<ReturnType<typeof getHomeSkills>>["top"];
}) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <Link href={href} className="text-sm text-accent">
          {viewAll} →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {skills.map((s) => (
          <SkillCard key={s.id} skill={s} />
        ))}
      </div>
    </section>
  );
}
