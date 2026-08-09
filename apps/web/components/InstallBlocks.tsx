import Markdown from "react-markdown";
import { useTranslations } from "next-intl";
import CopyButton from "./CopyButton";

export default function InstallBlocks({
  slug,
  repo,
  dir,
  command,
  guideMd,
}: {
  slug: string;
  repo: string;
  dir: string;
  command: string | null;
  guideMd: string;
}) {
  const t = useTranslations("detail");
  const prompt = t("installPrompt", { repo, dir, slug });
  return (
    <section className="my-8 border-y-2 border-dashed border-line bg-surface px-5 py-6">
      <h2 className="mb-4 text-center font-display text-lg font-bold tracking-widest">
        · · · {t("install")} · · ·
      </h2>

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
