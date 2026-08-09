"use client";

import { useTranslations } from "next-intl";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useFavorites } from "./FavoritesProvider";

export default function FavoriteButton({ skillId }: { skillId: string }) {
  const t = useTranslations("auth");
  const { ids, signedIn, toggle } = useFavorites();
  const on = ids.has(skillId);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? t("myList") : t("signInToSave")}
      title={signedIn ? undefined : t("signInToSave")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!signedIn) {
          void supabaseBrowser.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.href },
          });
          return;
        }
        void toggle(skillId);
      }}
      className={`rounded-lg px-2 py-1 text-sm transition-colors ${
        on ? "text-accent" : "text-ink-soft hover:text-ink"
      }`}
    >
      {on ? "♥" : "♡"}
    </button>
  );
}
