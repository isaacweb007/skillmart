import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CopyButton from "@/components/CopyButton";
import CopyChip from "@/components/CopyChip";
import { Link } from "@/i18n/navigation";
import { IMAGE_CATS, IMAGE_PROMPTS, type ImagePromptItem } from "@/lib/image-prompts";
import { pageAlternates } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: { absolute: t("seo.imagePromptsTitle") },
    description: t("seo.imagePromptsDesc"),
    alternates: pageAlternates(locale, "/image-prompts"),
  };
}

export default async function ImagePromptsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const pick = (p: ImagePromptItem) => (locale === "vi" ? p.vi : locale === "en" ? p.en : p.ko);

  let n = 0;
  const renderRow = (p: ImagePromptItem) => {
    n += 1;
    const text = pick(p);
    return (
      <li key={p.cmd} id={p.cmd} className="scroll-mt-24 rounded-xl border border-line bg-surface p-4">
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono-plex text-xs text-ink-soft">{String(n).padStart(2, "0")}</span>
          <CopyChip text={`/${p.cmd}`} title={t("prompts.copyCmd")} />
          <h3 className="font-display font-semibold">{text.label}</h3>
        </div>
        {/* 예시 결과물 — 텍스트 표는 복제돼도 결과물은 차별점. alt는 로케일 라벨(이미지 검색 유입) */}
        <img
          src={`/image-prompts/${p.cmd}.webp`}
          alt={text.label}
          loading="lazy"
          className="mb-2 max-h-64 w-auto rounded-lg border border-line"
        />
        <div className="flex items-start gap-2 rounded-lg border border-line bg-bg p-3">
          <p className="min-w-0 flex-1 font-mono-plex text-xs leading-relaxed">{text.example}</p>
          <CopyButton text={text.example} />
        </div>
      </li>
    );
  };

  return (
    <div className="py-10">
      <h1 className="mb-3 font-display text-3xl font-semibold">{t("imagePrompts.title")}</h1>
      <p className="mb-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
        {t("imagePrompts.lead")}
      </p>
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-ink-soft">
        {t("imagePrompts.tip")}
      </p>

      {IMAGE_CATS.map((cat) => (
        <section key={cat} className="mb-10">
          <h2 className="mb-4 font-display text-xl font-semibold">
            {t(`imagePrompts.cat.${cat}`)}
          </h2>
          <ol className="space-y-3">
            {IMAGE_PROMPTS.filter((p) => p.cat === cat).map(renderRow)}
          </ol>
        </section>
      ))}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/prompts"
          className="inline-block rounded-xl bg-accent px-5 py-3 font-semibold text-accent-ink"
        >
          {t("imagePrompts.toPrompts")} →
        </Link>
        <Link
          href="/guide"
          className="inline-block rounded-xl border border-line px-5 py-3 font-semibold text-ink"
        >
          {t("nav.guide")} →
        </Link>
      </div>
    </div>
  );
}
