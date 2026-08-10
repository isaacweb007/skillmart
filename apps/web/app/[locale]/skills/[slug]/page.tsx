import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Markdown from "react-markdown";
import Chip from "@/components/Chip";
import FavoriteButton from "@/components/FavoriteButton";
import InstallBlocks from "@/components/InstallBlocks";
import { Link } from "@/i18n/navigation";
import { getSkillBySlug } from "@/lib/db";
import { breadcrumb, jsonLd, softwareSourceCode } from "@/lib/jsonld";
import { pageAlternates, SITE_URL } from "@/lib/site";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const skill = await getSkillBySlug(slug, locale);
  if (!skill) return {};
  const t = await getTranslations({ locale });
  return {
    // 절대 제목 — "스킬 이름 + Claude Code 스킬"이 실제 검색어에 가깝다
    title: { absolute: t("seo.skillTitle", { name: skill.name }) },
    description: skill.one_liner,
    alternates: pageAlternates(locale, `/skills/${slug}`),
  };
}

export default async function SkillDetail({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const skill = await getSkillBySlug(slug, locale);
  if (!skill) notFound();

  const updated = skill.last_commit_at
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(skill.last_commit_at))
    : null;

  return (
    <article className="mx-auto max-w-2xl py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            breadcrumb(
              [
                { name: t("brand"), path: "" },
                { name: t("list.title"), path: "/skills" },
                { name: skill.name, path: `/skills/${slug}` },
              ],
              locale,
            ),
            softwareSourceCode({
              name: skill.name,
              description: skill.one_liner,
              url: `${SITE_URL}/${locale}/skills/${slug}`,
              codeRepository: skill.source_url,
              license: skill.license,
              locale,
            }),
          ]),
        }}
      />
      <Link href="/skills" className="text-sm text-ink-soft hover:text-ink">
        ← {t("detail.back")}
      </Link>

      <header className="mt-4 mb-6">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold">{skill.name}</h1>
          {skill.is_official && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-ink">
              {t("detail.official")}
            </span>
          )}
          <FavoriteButton skillId={skill.id} />
        </div>
        <p className="mb-3 text-ink-soft">{skill.one_liner}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <Chip>{t(`categories.${skill.category}`)}</Chip>
          {skill.difficulty && <Chip>{t(`difficulty.${skill.difficulty}`)}</Chip>}
          <span>★ {skill.stars.toLocaleString()}</span>
          <span>⑂ {skill.forks.toLocaleString()}</span>
          <span>
            {t("detail.score")} {skill.ai_score}/10
          </span>
          {updated && (
            <span>
              {t("detail.updated")}: {updated}
            </span>
          )}
        </div>
      </header>

      {skill.ai_review && (
        <aside className="mb-6 rounded-r-xl border-l-4 border-accent bg-surface px-4 py-3 text-sm leading-relaxed">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            {t("detail.aiReview")}
          </p>
          {skill.ai_review}
        </aside>
      )}

      <div className="md text-[15px]">
        <Markdown>{skill.description_md}</Markdown>
      </div>

      <InstallBlocks
        slug={slug}
        repo={skill.repo_full_name}
        dir={skill.path.slice(0, skill.path.lastIndexOf("/"))}
        command={skill.install_command}
        guideMd={skill.install_guide_md}
      />

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <a
          href={skill.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-accent px-5 py-3 font-semibold text-accent-ink"
        >
          {t("detail.source")} ↗
        </a>
        {skill.license && (
          <span className="text-ink-soft">
            {t("detail.license")}: {skill.license}
          </span>
        )}
      </div>
    </article>
  );
}
