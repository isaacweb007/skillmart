import Markdown from "react-markdown";
import { useTranslations } from "next-intl";
import CopyButton from "./CopyButton";

export default function InstallReceipt({
  command,
  guideMd,
}: {
  command: string | null;
  guideMd: string;
}) {
  const t = useTranslations("detail");
  return (
    <section className="my-8 border-y-2 border-dashed border-line bg-surface px-5 py-6 font-mono-plex text-sm">
      <h2 className="mb-4 text-center font-display text-lg font-bold tracking-widest">
        · · · {t("install")} · · ·
      </h2>
      {command && (
        <div className="mb-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-ink-soft">
            {t("installCommand")}
          </p>
          <div className="flex items-start gap-2 rounded-lg border border-line bg-bg p-3">
            <code className="min-w-0 flex-1 break-all text-xs leading-relaxed">{command}</code>
            <CopyButton text={command} />
          </div>
        </div>
      )}
      <div className="md font-body">
        <Markdown>{guideMd}</Markdown>
      </div>
    </section>
  );
}
