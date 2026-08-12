import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // 제외 목록이 아니라 명시 포함: 미들웨어는 루트 리다이렉트와 로케일 경로만 다룬다.
  // 제외 방식은 api·_vercel처럼 하나 빠질 때마다 터졌고(Web Analytics의 랜덤 고유 경로
  // /29e3…/view까지 로케일 리다이렉트로 삼킴), 플랫폼 경로는 미리 다 알 수 없다.
  matcher: ["/", "/(ko|vi|en)/:path*"],
};
