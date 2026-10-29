import CopyButton from "./CopyButton";

export interface StepItem {
  title: string;
  body: string;
  code?: string;
  note?: string;
}

/** 가이드·프로그램 공용 단계 렌더러 — 번호, 본문, 복사 가능한 코드/프롬프트 블록, 주의 줄 */
export default function StepList({ steps }: { steps: StepItem[] }) {
  return (
    <ol className="space-y-5">
      {steps.map((s, i) => (
        <li key={s.title} className="rounded-xl border border-line bg-surface p-4 sm:p-5">
          <div className="mb-2 flex items-baseline gap-3">
            <span className="font-mono-plex text-xs text-ink-tertiary">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="font-display font-semibold">{s.title}</h3>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink-muted">{s.body}</p>
          {s.code && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-bg p-3">
              <pre className="min-w-0 flex-1 overflow-x-auto font-mono-plex text-xs leading-relaxed whitespace-pre-wrap">{s.code}</pre>
              <CopyButton text={s.code} />
            </div>
          )}
          {s.note && (
            <p className="mt-3 border-l-2 border-line-strong pl-3 text-xs leading-relaxed text-ink-soft">{s.note}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** [라벨, 값] 뱃지 줄 — 출처·별 수·라이선스 같은 메타 */
export function BadgeRow({ badges }: { badges: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
      {badges.map(([label, value]) => (
        <span key={label}>
          <span className="text-ink-tertiary">{label}</span> {value}
        </span>
      ))}
    </div>
  );
}
