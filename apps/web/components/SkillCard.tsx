import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SkillListItem } from "@/lib/db";
import CategoryIcon from "./CategoryIcon";
import Chip from "./Chip";
import FavoriteButton from "./FavoriteButton";

const LEVEL = { beginner: 1, intermediate: 2, advanced: 3 } as const;

/** 난이도를 점 3개로 — 단어를 읽지 않고도 카드 사이 비교가 된다 */
function DifficultyDots({ difficulty, label }: { difficulty: string; label: string }) {
  const level = LEVEL[difficulty as keyof typeof LEVEL];
  if (!level) return null;
  return (
    <span className="inline-flex items-center gap-1" title={label} aria-label={label}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${n <= level ? "bg-ink-soft" : "bg-line-strong"}`}
        />
      ))}
    </span>
  );
}

export default function SkillCard({ skill }: { skill: SkillListItem }) {
  const t = useTranslations();
  return (
    <div className="relative">
      <Link
        href={`/skills/${skill.slug}`}
        className="group block rounded-xl border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong hover:bg-surface-2"
      >
        <div className="mb-1 flex items-baseline justify-between gap-2 pr-8">
          <h3 className="truncate font-display text-lg font-semibold group-hover:text-accent">
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
        {/* pr-14: 오른쪽 아래 ZIP 버튼 자리 — 없으면 점수와 겹친다 */}
        <div className="flex items-center gap-2 pr-14 text-xs text-ink-soft">
          <Chip>
            <CategoryIcon category={skill.category} className="h-3.5 w-3.5" />
            {t(`categories.${skill.category}`)}
          </Chip>
          {skill.difficulty && (
            <DifficultyDots difficulty={skill.difficulty} label={t(`difficulty.${skill.difficulty}`)} />
          )}
          <span>★ {skill.stars.toLocaleString()}</span>
          <span className="ml-auto">
            {t("detail.score")} {skill.ai_score}/10
          </span>
        </div>
      </Link>
      {/* 앵커 밖에 절대 배치 — <a> 안에 <button>을 넣으면 중첩 인터랙티브가 된다 */}
      <div className="absolute top-3 right-3">
        <FavoriteButton skillId={skill.id} />
      </div>
      {/* ZIP 바로받기 — 상세에 들어가지 않아도 내려받는 길. api 경로라 로케일 없는 일반 앵커 */}
      <a
        href={`/api/skills/${skill.slug}/zip`}
        title={t("detail.installAppDownload")}
        aria-label={`${t("detail.installAppDownload")}: ${skill.name}`}
        className="absolute right-3 bottom-3 rounded-md border border-line bg-bg px-2 py-1 font-mono-plex text-[11px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
      >
        ZIP ↓
      </a>
    </div>
  );
}
