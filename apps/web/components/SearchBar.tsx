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
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm placeholder:text-ink-soft"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink"
      >
        {t("searchButton")}
      </button>
    </form>
  );
}
