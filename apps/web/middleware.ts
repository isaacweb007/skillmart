import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // api는 로케일 라우팅 대상이 아니다 — 제외하지 않으면 /ko/api/... 로 307된다
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
