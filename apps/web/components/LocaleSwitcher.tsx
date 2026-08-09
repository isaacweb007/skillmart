"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { ko: "한국어", vi: "Tiếng Việt", en: "English" };

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 text-xs">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          className={`whitespace-nowrap rounded-full px-2 py-1 ${
            l === locale ? "bg-accent text-accent-ink" : "text-ink-soft hover:text-ink"
          }`}
        >
          {LABELS[l]}
        </Link>
      ))}
    </nav>
  );
}
