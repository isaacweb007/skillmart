"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function CopyButton({ text }: { text: string }) {
  const t = useTranslations("detail");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-live="polite"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // 클립보드 권한 거부 등 — 조용히 무시 (수동 복사 가능)
        }
      }}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        copied ? "bg-surface text-ink-soft" : "bg-accent text-accent-ink"
      }`}
    >
      {copied ? t("copied") : t("copy")}
    </button>
  );
}
