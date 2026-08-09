"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthButton() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <span className="text-xs text-ink-soft">&nbsp;</span>;

  if (!email) {
    return (
      <button
        type="button"
        onClick={async () => {
          const { error } = await supabaseBrowser.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.href },
          });
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
