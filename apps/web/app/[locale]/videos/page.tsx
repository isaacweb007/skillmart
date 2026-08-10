import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Chip from "@/components/Chip";
import { Link } from "@/i18n/navigation";
import { getVideos } from "@/lib/db";
import { pageAlternates } from "@/lib/site";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: { absolute: t("seo.videosTitle") },
    description: t("seo.videosDesc"),
    alternates: pageAlternates(locale, "/videos"),
  };
}

export default async function VideosPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const videos = await getVideos(locale);

  return (
    <div className="py-10">
      <h1 className="mb-3 font-display text-3xl font-bold">{t("videos.title")}</h1>
      <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{t("videos.lead")}</p>

      {videos.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
          {t("videos.empty")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {videos.map((v) => (
            <li key={v.video_id} className="rounded-xl border border-line bg-surface p-4">
              <a
                href={`https://www.youtube.com/watch?v=${v.video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                {/* 유튜브 섬네일은 원본을 그대로 쓴다(약관 요구). next/image 미사용 — 원격 도메인 설정 불필요 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.thumbnail_url}
                  alt=""
                  width={320}
                  height={180}
                  loading="lazy"
                  className="mb-3 w-full rounded-lg border border-line bg-bg object-cover"
                />
                <h2 className="mb-1 line-clamp-2 font-display font-bold group-hover:text-accent">
                  {v.title}
                </h2>
              </a>
              <p className="mb-2 text-xs text-ink-soft">
                {v.channel_title} · {t("videos.views", { count: v.views.toLocaleString() })} ·{" "}
                {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                  new Date(v.published_at),
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {v.has_caption && (
                  <span className="rounded-full border border-accent px-2 py-0.5 text-xs text-accent">
                    {t("videos.caption")}
                  </span>
                )}
                {v.category && (
                  <Link href={`/skills?category=${v.category}`}>
                    <Chip>{t(`categories.${v.category}`)}</Chip>
                  </Link>
                )}
                <a
                  href={`https://www.youtube.com/watch?v=${v.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-accent underline"
                >
                  {t("videos.onYoutube")} ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs leading-relaxed text-ink-soft">{t("videos.note")}</p>
    </div>
  );
}
