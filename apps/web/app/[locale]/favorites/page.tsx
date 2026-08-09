import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import FavoritesList from "@/components/FavoritesList";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  // 사용자별 페이지 — 크롤러에겐 빈 껍데기다
  return { title: t("auth.myList"), robots: { index: false, follow: false } };
}

export default async function FavoritesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <div className="py-10">
      <h1 className="mb-6 font-display text-3xl font-bold">{t("myList")}</h1>
      <FavoritesList />
    </div>
  );
}
