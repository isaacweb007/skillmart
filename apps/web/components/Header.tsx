import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import AuthButton from "./AuthButton";
import LocaleSwitcher from "./LocaleSwitcher";

export default function Header() {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur">
      {/* flex-wrap + nowrap: 좁은 화면에서 항목이 줄바꿈되게 한다.
          없으면 375px에서 flex가 항목을 최소폭으로 짜내 글자가 세로로 쪼개진다 */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="font-display text-lg font-bold whitespace-nowrap">
          {t("brand")}
        </Link>
        <Link href="/skills" className="py-1.5 text-sm whitespace-nowrap text-ink-soft hover:text-ink">
          {t("nav.skills")}
        </Link>
        <Link href="/prompts" className="py-1.5 text-sm whitespace-nowrap text-ink-soft hover:text-ink">
          {t("nav.prompts")}
        </Link>
        <Link href="/videos" className="py-1.5 text-sm whitespace-nowrap text-ink-soft hover:text-ink">
          {t("nav.videos")}
        </Link>
        <Link href="/terminal" className="py-1.5 text-sm whitespace-nowrap text-ink-soft hover:text-ink">
          {t("nav.terminal")}
        </Link>
        <Link href="/guide" className="py-1.5 text-sm whitespace-nowrap text-ink-soft hover:text-ink">
          {t("nav.guide")}
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <AuthButton />
          <Suspense fallback={null}>
            <LocaleSwitcher />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
