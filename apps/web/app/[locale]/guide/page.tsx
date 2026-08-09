import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t("guide.title"),
    description: t("guide.lead"),
    alternates: pageAlternates(locale, "/guide"),
  };
}

export default async function GuidePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guide");
  return (
    <article className="mx-auto max-w-2xl py-10">
      <h1 className="mb-4 font-display text-3xl font-bold">{t("title")}</h1>
      <p className="mb-10 text-[15px] leading-relaxed text-ink-soft">{t("lead")}</p>

      <h2 className="mb-3 font-display text-xl font-bold">{t("whyTitle")}</h2>
      <ul className="mb-10 list-disc space-y-2 pl-5 text-[15px] leading-relaxed">
        <li>{t("why1")}</li>
        <li>{t("why2")}</li>
        <li>{t("why3")}</li>
      </ul>

      <h2 className="mb-3 font-display text-xl font-bold">{t("howTitle")}</h2>
      <div className="mb-10 space-y-3 text-[15px] leading-relaxed">
        <p className="rounded-xl border border-line bg-surface p-4">{t("howApp")}</p>
        <p className="rounded-xl border border-line bg-surface p-4">{t("howCode")}</p>
      </div>

      <h2 className="mb-3 font-display text-xl font-bold">{t("safeTitle")}</h2>
      <p className="mb-10 text-[15px] leading-relaxed text-ink-soft">{t("safeBody")}</p>

      <Link
        href="/skills"
        className="inline-block rounded-xl bg-accent px-5 py-3 font-semibold text-accent-ink"
      >
        {t("cta")} →
      </Link>
    </article>
  );
}
