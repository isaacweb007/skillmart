import { useTranslations } from "next-intl";

const TELEGRAM_ID = "T_o_n_y_D_H";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-16 border-t border-line py-8 text-center text-xs leading-relaxed text-ink-soft">
      <div className="mx-auto max-w-5xl px-4">
        <p>{t("disclaimer")}</p>
        <p>{t("dataNote")}</p>
        <p className="mt-3">
          <a
            href={`https://t.me/${TELEGRAM_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            {t("contact")} · Telegram @{TELEGRAM_ID}
          </a>
        </p>
      </div>
    </footer>
  );
}
