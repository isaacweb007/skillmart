"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
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
  const { ids, signedIn } = useFavorites();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
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
  }, [ids, locale]);

  if (!signedIn) return <p className="text-sm text-ink-soft">{t("signInToSave")}</p>;
  if (rows === null) return <p className="text-sm text-ink-soft">{t("loading")}</p>;
  if (rows.length === 0) return <p className="text-sm text-ink-soft">{t("empty")}</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((r) => (
        <Link
          key={r.id}
          href={`/skills/${r.slug}`}
          className="block rounded-xl border border-line bg-surface p-4 hover:shadow-sm"
        >
          <h3 className="mb-1 truncate font-display text-lg font-bold">{r.name}</h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{r.one_liner}</p>
        </Link>
      ))}
    </div>
  );
}
