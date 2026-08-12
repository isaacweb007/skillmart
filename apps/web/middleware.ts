import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // api·_vercel은 로케일 라우팅 대상이 아니다 — 제외하지 않으면 /ko/api/... 로 307된다
  // (_vercel 미제외 시 Web Analytics 수집 POST /_vercel/insights/view가 리다이렉트로 유실)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
