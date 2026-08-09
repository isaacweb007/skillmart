"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function CopyButton({ text }: { text: string }) {
  const t = useTranslations("detail");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        copied ? "bg-surface text-ink-soft" : "bg-accent text-accent-ink"
      }`}
    >
      {copied ? t("copied") : t("copy")}
    </button>
  );
}
