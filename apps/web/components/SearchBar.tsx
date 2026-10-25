import { useTranslations } from "next-intl";

export default function SearchBar({ locale, defaultValue = "" }: { locale: string; defaultValue?: string }) {
  const t = useTranslations("home");
  return (
    <form action={`/${locale}/skills`} method="GET" className="flex gap-2" role="search">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm transition-colors placeholder:text-ink-tertiary focus:border-line-strong"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
      >
        {t("searchButton")}
      </button>
    </form>
  );
}
