"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signInWithGoogle, supabaseBrowser } from "@/lib/supabase-browser";
import { useFavorites } from "./FavoritesProvider";

export default function AuthButton() {
  const t = useTranslations("auth");
  // 세션 구독은 FavoritesProvider 하나뿐 — 여기서 또 구독하면 리스너가 둘이 된다
  const { signedIn, ready } = useFavorites();

  if (!ready) return <span className="text-xs text-ink-soft">&nbsp;</span>;

  if (!signedIn) {
    return (
      <button
        type="button"
        onClick={async () => {
          const { error } = await signInWithGoogle();
          if (error) alert(t("failed"));
        }}
        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink"
      >
        {t("signIn")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <Link href="/favorites" className="text-ink-soft hover:text-ink">
        {t("myList")}
      </Link>
      <button
        type="button"
        onClick={() => supabaseBrowser.auth.signOut()}
        className="text-ink-soft hover:text-ink"
      >
        {t("signOut")}
      </button>
    </div>
  );
}
