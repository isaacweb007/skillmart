import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";

export default function Header() {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="font-display text-lg font-bold">
          {t("brand")}
        </Link>
        <Link href="/skills" className="text-sm text-ink-soft hover:text-ink">
          {t("nav.skills")}
        </Link>
        <Link href="/guide" className="text-sm text-ink-soft hover:text-ink">
          {t("nav.guide")}
        </Link>
        <div className="ml-auto">
          <Suspense fallback={null}>
            <LocaleSwitcher />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
