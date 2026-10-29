import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const TABS = [
  { href: "/prompts", key: "text" },
  { href: "/image-prompts", key: "image" },
  { href: "/chatgpt", key: "gpt" },
] as const;

/** 명령어 3형제(글·이미지·ChatGPT) 공통 탭 — 각 페이지 제목 아래에 놓인다 */
export default function PromptTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  const t = useTranslations("promptTabs");
  return (
    <nav className="mb-8 flex gap-1.5" aria-label={t("label")}>
      {TABS.map(({ href, key }) => (
        <Link
          key={key}
          href={href}
          aria-current={key === active ? "page" : undefined}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            key === active
              ? "border-accent bg-accent font-medium text-accent-ink"
              : "border-line text-ink-soft hover:border-line-strong hover:text-ink"
          }`}
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
