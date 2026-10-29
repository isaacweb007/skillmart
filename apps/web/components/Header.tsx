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
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold whitespace-nowrap">
          {/* 브랜드 마크 — app/icon.svg의 영수증 슬립과 동일 기하 */}
          <svg viewBox="0 0 32 32" aria-hidden="true" className="h-6 w-6 shrink-0 rounded-md border border-line bg-surface">
            <path d="M9 4.5 H23 V21 L20.67 26 L18.33 21 L16 26 L13.67 21 L11.33 26 L9 21 Z" fill="#f7f8f8" />
            <rect x="11.8" y="8.5" width="8.4" height="2.4" rx="1.2" fill="#5e6ad2" />
            <rect x="11.8" y="13" width="5.6" height="2.4" rx="1.2" fill="#5e6ad2" />
          </svg>
          {t("brand")}
        </Link>
        <Link href="/skills" className="py-1.5 text-sm whitespace-nowrap text-ink-soft hover:text-ink">
          {t("nav.skills")}
        </Link>
        {/* 1차 링크는 5개로 유지한다 — 이미지 명령어·영상·터미널은 명령어/배우기 허브 안에서 진입 */}
        <Link href="/prompts" className="py-1.5 text-sm whitespace-nowrap text-ink-soft hover:text-ink">
          {t("nav.prompts")}
        </Link>
        <Link href="/programs" className="py-1.5 text-sm whitespace-nowrap text-ink-soft hover:text-ink">
          {t("nav.programs")}
        </Link>
        <Link href="/learn" className="py-1.5 text-sm whitespace-nowrap text-ink-soft hover:text-ink">
          {t("nav.learn")}
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
