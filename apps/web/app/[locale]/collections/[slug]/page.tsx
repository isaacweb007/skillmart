import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SkillCard from "@/components/SkillCard";
import { Link } from "@/i18n/navigation";
import { getCollectionBySlug } from "@/lib/db";
import { pageAlternates } from "@/lib/site";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getCollectionBySlug(slug, locale);
  if (!data) return {};
  return {
    title: data.summary.title,
    description: data.summary.description,
    alternates: pageAlternates(locale, `/collections/${slug}`),
  };
}

export default async function CollectionPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const data = await getCollectionBySlug(slug, locale);
  if (!data) notFound();

  return (
    <div className="py-8">
      <Link href="/" className="text-sm text-ink-soft hover:text-ink">
        ← {t("collection.back")}
      </Link>
      <h1 className="mt-4 mb-2 font-display text-3xl font-bold">{data.summary.title}</h1>
      <p className="mb-6 max-w-2xl leading-relaxed text-ink-soft">{data.summary.description}</p>
      <p className="mb-4 text-sm text-ink-soft">
        {t("collection.skillCount", { count: data.skills.length })}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.skills.map((s) => (
          <SkillCard key={s.id} skill={s} />
        ))}
      </div>
    </div>
  );
}
