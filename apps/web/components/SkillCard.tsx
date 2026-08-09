import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SkillListItem } from "@/lib/db";
import Chip from "./Chip";

export default function SkillCard({ skill }: { skill: SkillListItem }) {
  const t = useTranslations();
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group block rounded-xl border border-line bg-surface p-4 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="truncate font-display text-lg font-bold group-hover:text-accent">
          {skill.name}
        </h3>
        {skill.is_official && (
          <span className="shrink-0 text-xs font-semibold text-accent">
            {t("detail.official")}
          </span>
        )}
      </div>
      <p className="mb-3 line-clamp-2 min-h-10 text-sm leading-relaxed text-ink-soft">
        {skill.one_liner}
      </p>
      <div className="flex items-center gap-2 text-xs text-ink-soft">
        <Chip>{t(`categories.${skill.category}`)}</Chip>
        <span>★ {skill.stars.toLocaleString()}</span>
        <span className="ml-auto">
          {t("detail.score")} {skill.ai_score}/10
        </span>
      </div>
    </Link>
  );
}
