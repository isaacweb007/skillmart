import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { getSkillBySlug } from "@/lib/db";
import { clip, OG_SIZE, OgReceipt, ogFonts, ogTitle } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });
  const skill = await getSkillBySlug(slug, locale);

  // 스킬이 내려갔으면 브랜드 영수증으로 대체 (크롤러에 깨진 이미지를 주지 않는다)
  const eyebrow = skill ? t(`categories.${skill.category}`) : t("og.stall");
  const title = skill ? skill.name : t("brand");
  const line = skill ? skill.one_liner : t("og.tagline");
  const footerRight = skill
    ? `★ ${skill.stars.toLocaleString()}   ${t("detail.score")} ${skill.ai_score}/10`
    : t("og.tagline");

  return new ImageResponse(
    (
      <OgReceipt
        eyebrow={clip(eyebrow, 24)}
        title={ogTitle(title)}
        line={clip(line, 46)}
        footerRight={footerRight}
      />
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
