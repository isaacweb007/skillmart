"use client";

import { useTranslations } from "next-intl";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("error");
  return (
    <div className="py-24 text-center">
      <h1 className="mb-2 font-display text-2xl font-bold">{t("title")}</h1>
      <p className="mb-6 text-sm text-ink-soft">{t("desc")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink"
      >
        {t("retry")}
      </button>
    </div>
  );
}
