import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeRow } from "@/components/StepList";
import { Link } from "@/i18n/navigation";
import { GUIDES } from "@/lib/learn";
import { pageAlternates } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: { absolute: t("seo.learnTitle") },
    description: t("seo.learnDesc"),
    alternates: pageAlternates(locale, "/learn"),
  };
}

/** 시작 트랙 — 터미널이 어려운 사람이 밟는 순서. 기존 페이지들을 길로 엮는다 */
const START_CARDS = [
  { href: "/guide", key: "what" },
  { href: "/chatgpt", key: "gpt" },
  { href: "/terminal", key: "terminal" },
  { href: "/videos", key: "videos" },
] as const;

export default async function LearnPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const loc = (locale === "vi" ? "vi" : locale === "en" ? "en" : "ko") as "ko" | "vi" | "en";

  return (
    <div className="py-10">
      <h1 className="mb-3 font-display text-3xl font-semibold">{t("learnPage.title")}</h1>
      <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{t("learnPage.lead")}</p>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl font-semibold">{t("learnPage.startTitle")}</h2>
        <ol className="grid gap-2 sm:grid-cols-2">
          {START_CARDS.map(({ href, key }, i) => (
            <li key={key}>
              <Link
                href={href}
                className="group flex h-full items-start gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
              >
                <span className="font-mono-plex text-xs text-ink-tertiary">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block font-display font-semibold group-hover:text-accent">
                    {t(`learnPage.cards.${key}.title`)}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                    {t(`learnPage.cards.${key}.desc`)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-1 font-display text-xl font-semibold">{t("learnPage.readTitle")}</h2>
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-ink-soft">{t("learnPage.readLead")}</p>
        <div className="space-y-3">
          {GUIDES.map((g) => {
            const text = g[loc];
            return (
              <Link
                key={g.slug}
                href={`/learn/${g.slug}`}
                className="group block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2 sm:p-5"
              >
                <h3 className="mb-1 font-display text-lg font-semibold group-hover:text-accent">{text.name}</h3>
                <p className="mb-3 text-sm leading-relaxed text-ink-soft">{text.oneLiner}</p>
                <BadgeRow badges={text.badges} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
