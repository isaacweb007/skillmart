"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

export default function SearchBar({ locale, defaultValue = "" }: { locale: string; defaultValue?: string }) {
  const t = useTranslations("home");
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" 한 키로 어디서든 검색으로 — 1,694개 디렉터리의 가장 빠른 입구.
  // 이미 입력 중이거나 조합키가 섞이면 양보한다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return;
      if (el instanceof HTMLElement && el.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form action={`/${locale}/skills`} method="GET" className="flex gap-2" role="search">
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          aria-keyshortcuts="/"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 pr-10 text-sm transition-colors placeholder:text-ink-tertiary focus:border-line-strong"
        />
        {/* 터치 기기엔 의미 없는 힌트라 sm 이상에서만 보인다 */}
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-line bg-bg px-1.5 py-0.5 font-mono-plex text-[11px] text-ink-tertiary sm:block"
        >
          /
        </kbd>
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
      >
        {t("searchButton")}
      </button>
    </form>
  );
}
