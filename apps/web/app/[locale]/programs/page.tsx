import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import StepList, { BadgeRow } from "@/components/StepList";
import { PROGRAMS } from "@/lib/programs";
import { pageAlternates } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: { absolute: t("seo.programsTitle") },
    description: t("seo.programsDesc"),
    alternates: pageAlternates(locale, "/programs"),
  };
}

export default async function ProgramsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const loc = (locale === "vi" ? "vi" : locale === "en" ? "en" : "ko") as "ko" | "vi" | "en";

  return (
    <div className="py-10">
      <h1 className="mb-3 font-display text-3xl font-semibold">{t("programsPage.title")}</h1>
      <p className="mb-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{t("programsPage.lead")}</p>
      {/* 목차 — 프로그램이 늘면 이 줄이 탐색이 된다 */}
      <div className="mb-10 flex flex-wrap gap-2">
        {PROGRAMS.map((p) => (
          <a
            key={p.slug}
            href={`#${p.slug}`}
            className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            {p.name}
          </a>
        ))}
      </div>

      <div className="space-y-14">
        {PROGRAMS.map((p) => {
          const text = p[loc];
          return (
            <section key={p.slug} id={p.slug} className="scroll-mt-24">
              <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-2xl font-semibold">{p.name}</h2>
                <a
                  href={p.url}
                  rel="noopener"
                  className="text-xs text-accent underline underline-offset-2 hover:text-accent-hover"
                >
                  {p.repo} ↗
                </a>
              </div>
              <p className="mb-3 text-[15px] text-ink-soft">{text.oneLiner}</p>
              <BadgeRow badges={text.badges} />
              <p className="mt-4 mb-6 max-w-3xl text-sm leading-relaxed text-ink-muted">{text.desc}</p>
              <h3 className="eyebrow mb-3">{t("programsPage.install")}</h3>
              <StepList steps={text.steps} />
            </section>
          );
        })}
      </div>

      <p className="mt-10 text-xs leading-relaxed text-ink-tertiary">{t("programsPage.snapshotNote")}</p>
    </div>
  );
}
