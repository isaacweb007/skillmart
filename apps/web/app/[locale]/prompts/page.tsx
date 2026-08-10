import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CopyButton from "@/components/CopyButton";
import CopyChip from "@/components/CopyChip";
import { Link } from "@/i18n/navigation";
import { getDailyPrompts } from "@/lib/db";
import { PROMPTS } from "@/lib/prompts";
import { pageAlternates } from "@/lib/site";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: { absolute: t("seo.promptsTitle") },
    description: t("seo.promptsDesc"),
    alternates: pageAlternates(locale, "/prompts"),
  };
}

interface Row {
  cmd: string;
  category: string;
  label: string;
  example: string;
}

export default async function PromptsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const daily = await getDailyPrompts(locale);

  const seed: Row[] = PROMPTS.map((p) => {
    const text = locale === "vi" ? p.vi : locale === "en" ? p.en : p.ko;
    return { cmd: p.cmd, category: p.category, label: text.label, example: text.example };
  });

  const renderRow = (row: Row, n: number) => (
    <li key={row.cmd} id={row.cmd} className="scroll-mt-24 rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono-plex text-xs text-ink-soft">{String(n).padStart(2, "0")}</span>
        {/* 이름표일 뿐 — Claude의 정식 명령어가 아니다(상단 안내 문구에 명시). 클릭하면 복사된다 */}
        <CopyChip text={`/${row.cmd}`} title={t("prompts.copyCmd")} />
        <h2 className="font-display font-bold">{row.label}</h2>
        <Link
          href={`/skills?category=${row.category}`}
          className="ml-auto text-xs whitespace-nowrap text-accent underline"
        >
          {t("prompts.auto")}: {t(`categories.${row.category}`)} →
        </Link>
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-line bg-bg p-3">
        <p className="min-w-0 flex-1 font-mono-plex text-xs leading-relaxed">{row.example}</p>
        <CopyButton text={row.example} />
      </div>
    </li>
  );

  return (
    <div className="py-10">
      <h1 className="mb-3 font-display text-3xl font-bold">{t("prompts.title")}</h1>
      <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
        {t("prompts.lead")}
      </p>

      {daily.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 font-display text-xl font-bold">{t("prompts.newTitle")}</h2>
          <p className="mb-4 text-sm text-ink-soft">{t("prompts.newLead")}</p>
          <ol className="space-y-3">{daily.map((row, i) => renderRow(row, i + 1))}</ol>
        </section>
      )}

      <ol className="space-y-3">{seed.map((row, i) => renderRow(row, i + 1))}</ol>

      <div className="mt-10">
        <Link
          href="/guide"
          className="inline-block rounded-xl bg-accent px-5 py-3 font-semibold text-accent-ink"
        >
          {t("nav.guide")} →
        </Link>
      </div>
    </div>
  );
}
