import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ONRAMP } from "@/lib/onramp";
import { pageAlternates } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: { absolute: t("seo.guideTitle") },
    description: t("seo.guideDesc"),
    alternates: pageAlternates(locale, "/guide"),
  };
}

export default async function GuidePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guide");
  const tc = await getTranslations(); // 코너 이름은 categories.* 를 재사용
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

      <h2 className="mb-3 font-display text-xl font-bold">{t("onramp.title")}</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-ink-soft">{t("onramp.lead")}</p>
      <div className="mb-10 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th className="py-2 pr-4 font-semibold">{t("onramp.colPaste")}</th>
              <th className="py-2 font-semibold">{t("onramp.colAuto")}</th>
            </tr>
          </thead>
          <tbody>
            {ONRAMP.map((row) => (
              <tr key={row.key} className="border-b border-line align-top">
                <td className="py-3 pr-4 leading-relaxed">{t(`onramp.${row.key}`)}</td>
                <td className="py-3 whitespace-nowrap">
                  <Link href={`/skills?category=${row.category}`} className="text-accent underline">
                    {tc(`categories.${row.category}`)} →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
