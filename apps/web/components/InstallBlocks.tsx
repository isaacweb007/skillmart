import Markdown from "react-markdown";
import { useTranslations } from "next-intl";
import CopyButton from "./CopyButton";

export default function InstallBlocks({
  slug,
  repo,
  dir,
  path,
  command,
  guideMd,
}: {
  slug: string;
  repo: string;
  dir: string;
  path: string;
  command: string | null;
  guideMd: string;
}) {
  const t = useTranslations("detail");
  const prompt = t("installPrompt", { repo, dir, slug });
  // 설치 없이 쓰는 경로 — 원본 SKILL.md를 링크할 뿐 내용을 재배포하지 않는다
  const rawUrl = `https://raw.githubusercontent.com/${repo}/HEAD/${path}`;
  const tryPrompt = t("tryPrompt", { rawUrl });
  return (
    <section className="my-8 border-y-2 border-dashed border-line bg-surface px-5 py-6">
      <h2 className="mb-4 text-center font-display text-lg font-bold tracking-widest">
        · · · {t("install")} · · ·
      </h2>

      {/* 가장 마찰이 적은 경로를 맨 위에 — 첫 방문자가 10초 안에 써볼 수 있다 */}
      <details open className="mb-3 rounded-xl border-2 border-accent bg-bg p-4">
        <summary className="cursor-pointer font-display font-bold">{t("tryTitle")}</summary>
        <p className="mt-3 mb-2 text-sm text-ink-soft">{t("tryLead")}</p>
        <div className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3">
          <pre className="min-w-0 flex-1 whitespace-pre-wrap font-mono-plex text-xs leading-relaxed">
            {tryPrompt}
          </pre>
          <CopyButton text={tryPrompt} />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">{t("tryFallback")}</p>
        <p className="mt-3 text-sm leading-relaxed">↓ {t("tryConvert")}</p>
      </details>

      <details open className="mb-3 rounded-xl border border-line bg-bg p-4">
        <summary className="cursor-pointer font-display font-bold">{t("installAppTitle")}</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>{t("installAppStep1")}</li>
          <li>{t("installAppStep2")}</li>
          <li>{t("installAppStep3")}</li>
        </ol>
        <a
          href={`/api/skills/${slug}/zip`}
          className="mt-4 inline-block rounded-xl bg-accent px-5 py-3 font-semibold text-accent-ink"
        >
          ↓ {t("installAppDownload")}
        </a>
      </details>

      <details className="rounded-xl border border-line bg-bg p-4">
        <summary className="cursor-pointer font-display font-bold">{t("installCodeTitle")}</summary>
        <p className="mt-3 mb-2 text-sm text-ink-soft">{t("installCodeAsk")}</p>
        <div className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3">
          <pre className="min-w-0 flex-1 whitespace-pre-wrap font-mono-plex text-xs leading-relaxed">
            {prompt}
          </pre>
          <CopyButton text={prompt} />
        </div>
        {command && (
          <div className="mt-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-ink-soft">
              {t("installCodeManual")}
            </p>
            <div className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3">
              <code className="min-w-0 flex-1 break-all font-mono-plex text-xs leading-relaxed">
                {command}
              </code>
              <CopyButton text={command} />
            </div>
          </div>
        )}
      </details>

      <p className="mt-4 text-xs leading-relaxed text-ink-soft">⚠ {t("installTrust")}</p>

      <div className="md mt-6 font-body">
        <Markdown>{guideMd}</Markdown>
      </div>
    </section>
  );
}
