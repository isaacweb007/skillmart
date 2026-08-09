import { getTranslations, setRequestLocale } from "next-intl/server";
import Chip from "@/components/Chip";
import SearchBar from "@/components/SearchBar";
import SkillCard from "@/components/SkillCard";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/categories";
import { getCollections, getHomeSkills, getTrendingSkills, getVisibleCount } from "@/lib/db";

export const revalidate = 3600;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [count, { top, fresh }, trending, collections] = await Promise.all([
    getVisibleCount(),
    getHomeSkills(locale),
    getTrendingSkills(locale),
    getCollections(locale),
  ]);

  return (
    <div className="py-10">
      <section className="mb-12 text-center">
        <h1 className="mb-3 font-display text-3xl font-bold sm:text-4xl">
          {t("home.heroTitle")}
        </h1>
        <p className="mb-6 text-sm text-ink-soft">{t("home.heroSubtitle", { count })}</p>
        <div className="mx-auto max-w-xl">
          <SearchBar locale={locale} />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl font-bold">{t("home.corners")}</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/skills?category=${c}`}>
              <Chip>{t(`categories.${c}`)}</Chip>
            </Link>
          ))}
        </div>
      </section>

      {collections.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 font-display text-xl font-bold">{t("home.collections")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="group block rounded-xl border border-line bg-surface p-4 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <h3 className="mb-1 font-display text-lg font-bold group-hover:text-accent">{c.title}</h3>
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
        <h2 className="font-display text-xl font-bold">{title}</h2>
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
