import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // OG 라우트가 폰트를 런타임 경로(readFile)로 읽으므로 번들 트레이스에 잡히지 않는다.
  // 명시하지 않으면 Vercel 함수에 폰트가 빠져 500이 난다(로컬 next start에서는 재현되지 않음).
  outputFileTracingIncludes: {
    "/[locale]/opengraph-image": ["./assets/fonts/**"],
    "/[locale]/skills/[slug]/opengraph-image": ["./assets/fonts/**"],
  },
};

export default withNextIntl(nextConfig);
