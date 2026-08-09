import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-16 border-t border-line py-8 text-center text-xs leading-relaxed text-ink-soft">
      <div className="mx-auto max-w-5xl px-4">
        <p>{t("disclaimer")}</p>
        <p>{t("dataNote")}</p>
      </div>
    </footer>
  );
}
