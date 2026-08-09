import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { getVisibleCount } from "@/lib/db";
import { clip, OG_SIZE, OgReceipt, ogFonts } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const count = await getVisibleCount();

  return new ImageResponse(
    (
      <OgReceipt
        eyebrow={t("og.stall")}
        title={t("brand")}
        line={clip(t("og.tagline"), 46)}
        footerRight={t("og.count", { count })}
      />
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
