"use client";

import { createClient } from "@supabase/supabase-js";

/** 브라우저 전용 클라이언트 — 세션은 localStorage, OAuth 복귀 시 URL의 code를 자동 교환한다.
 *  서버용 클라이언트는 lib/db.ts(server-only)로 분리되어 있다. */
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/** 헤더·♡·보관함 세 곳이 같은 호출을 복사해 쓰고 있었다. 돌아올 곳은 항상 지금 보던 URL. */
export function signInWithGoogle() {
  return supabaseBrowser.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href },
  });
}
