import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import FavoritesProvider from "@/components/FavoritesProvider";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { routing } from "@/i18n/routing";
import { plex, plexMono, sourceSerif } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("brand"), template: `%s — ${t("brand")}` },
    description: t("tagline"),
    openGraph: {
      siteName: t("brand"),
      type: "website",
      locale,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const fontVars = `${sourceSerif.variable} ${plex.variable} ${plexMono.variable}`;
  return (
    <html lang={locale} className={fontVars}>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <FavoritesProvider>
            <Header />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4">{children}</main>
            <Footer />
          </FavoritesProvider>
        </NextIntlClientProvider>
        {/* Vercel 대시보드에서 Web Analytics를 켜야 수집 시작 — 꺼져 있으면 조용히 no-op */}
        <Analytics />
        {/* GA4 — NEXT_PUBLIC_GA_ID(G-…)가 빌드에 있을 때만 로드. 라우트 전환은
            GA4 향상된 측정(브라우저 방문 기록 이벤트, 기본 켜짐)이 잡는다 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
