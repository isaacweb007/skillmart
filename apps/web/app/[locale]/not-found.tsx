import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="py-24 text-center">
      <h1 className="mb-2 font-display text-2xl font-bold">{t("title")}</h1>
      <p className="mb-6 text-sm text-ink-soft">{t("desc")}</p>
      <Link href="/" className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink">
        {t("back")}
      </Link>
    </div>
  );
}
