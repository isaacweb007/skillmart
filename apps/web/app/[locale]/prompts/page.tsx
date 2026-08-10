import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CopyButton from "@/components/CopyButton";
import { Link } from "@/i18n/navigation";
import { PROMPTS } from "@/lib/prompts";
import { pageAlternates } from "@/lib/site";

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

function pick(item: (typeof PROMPTS)[number], locale: string) {
  if (locale === "vi") return item.vi;
  if (locale === "en") return item.en;
  return item.ko;
}

export default async function PromptsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="py-10">
      <h1 className="mb-3 font-display text-3xl font-bold">{t("prompts.title")}</h1>
      <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
        {t("prompts.lead")}
      </p>

      <ol className="space-y-3">
        {PROMPTS.map((item, i) => {
          const text = pick(item, locale);
          return (
            <li
              key={item.cmd}
              id={item.cmd}
              className="scroll-mt-24 rounded-xl border border-line bg-surface p-4"
            >
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono-plex text-xs text-ink-soft">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {/* 이름표일 뿐 — Claude의 정식 명령어가 아니다(상단 안내 문구에 명시) */}
                <code className="rounded-md bg-bg px-2 py-0.5 font-mono-plex text-xs text-accent">
                  /{item.cmd}
                </code>
                <h2 className="font-display font-bold">{text.label}</h2>
                <Link
                  href={`/skills?category=${item.category}`}
                  className="ml-auto text-xs whitespace-nowrap text-accent underline"
                >
                  {t("prompts.auto")}: {t(`categories.${item.category}`)} →
                </Link>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-line bg-bg p-3">
                <p className="min-w-0 flex-1 font-mono-plex text-xs leading-relaxed">
                  {text.example}
                </p>
                <CopyButton text={text.example} />
              </div>
            </li>
          );
        })}
      </ol>

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
