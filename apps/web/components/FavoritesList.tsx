"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signInWithGoogle, supabaseBrowser } from "@/lib/supabase-browser";
import FavoriteButton from "./FavoriteButton";
import { useFavorites } from "./FavoritesProvider";

interface Row {
  id: string;
  slug: string;
  name: string;
  one_liner: string;
}

interface Translation {
  locale: string;
  name: string;
  one_liner: string;
}

export default function FavoritesList() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { ids, signedIn, ready } = useFavorites();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (ids.size === 0) {
      setRows([]);
      return;
    }
    void supabaseBrowser
      .from("skills")
      .select("id, slug, skill_translations(locale, name, one_liner)")
      .eq("status", "visible")
      .in("id", [...ids])
      .then(({ data }) => {
        setRows(
          (data ?? []).map((r) => {
            const trs = (r.skill_translations ?? []) as Translation[];
            const tr =
              trs.find((x) => x.locale === locale) ?? trs.find((x) => x.locale === "en") ?? trs[0];
            return {
              id: r.id as string,
              slug: r.slug as string,
              name: tr?.name ?? (r.slug as string),
              one_liner: tr?.one_liner ?? "",
            };
          }),
        );
      });
  }, [ids, locale, ready]);

  // ready 전에 signedIn을 믿으면 로그인한 사람도 첫 프레임에 "로그인하세요"를 본다
  if (!ready) return <p className="text-sm text-ink-soft">{t("loading")}</p>;

  if (!signedIn)
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-ink-soft">{t("signInToSave")}</p>
        <button
          type="button"
          onClick={async () => {
            const { error } = await signInWithGoogle();
            if (error) alert(t("failed"));
          }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink"
        >
          {t("signInGoogle")}
        </button>
      </div>
    );

  if (rows === null) return <p className="text-sm text-ink-soft">{t("loading")}</p>;
  if (rows.length === 0) return <p className="text-sm text-ink-soft">{t("empty")}</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.id} className="relative">
          <Link
            href={`/skills/${r.slug}`}
            className="block rounded-xl border border-line bg-surface p-4 hover:shadow-sm"
          >
            <h3 className="mb-1 truncate pr-8 font-display text-lg font-bold">{r.name}</h3>
            <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{r.one_liner}</p>
          </Link>
          {/* 앵커 밖에 절대 배치 — SkillCard와 같은 이유(중첩 인터랙티브 금지) */}
          <div className="absolute top-3 right-3">
            <FavoriteButton skillId={r.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
