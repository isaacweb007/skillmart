import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import StepList, { BadgeRow } from "@/components/StepList";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { GUIDES } from "@/lib/learn";
import { pageAlternates } from "@/lib/site";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => GUIDES.map((g) => ({ locale, slug: g.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) return {};
  const loc = (locale === "vi" ? "vi" : locale === "en" ? "en" : "ko") as "ko" | "vi" | "en";
  return {
    title: guide[loc].name,
    description: guide[loc].oneLiner,
    alternates: pageAlternates(locale, `/learn/${slug}`),
  };
}

export default async function GuidePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) notFound();
  const t = await getTranslations();
  const loc = (locale === "vi" ? "vi" : locale === "en" ? "en" : "ko") as "ko" | "vi" | "en";
  const text = guide[loc];

  return (
    <div className="py-10">
      <Link href="/learn" className="text-sm text-ink-soft hover:text-ink">
        ← {t("learnPage.title")}
      </Link>
      <h1 className="mt-4 mb-2 font-display text-3xl font-semibold">{text.name}</h1>
      <p className="mb-3 text-[15px] text-ink-soft">{text.oneLiner}</p>
      <BadgeRow badges={text.badges} />
      <p className="mt-6 mb-8 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-ink-muted">{text.desc}</p>

      <StepList steps={text.steps} />

      <p className="mt-8 text-xs text-ink-tertiary">
        {t("learnPage.original")}:{" "}
        <a href={guide.url} rel="noopener" className="underline hover:text-ink-soft">
          {guide.url}
        </a>
      </p>
    </div>
  );
}
