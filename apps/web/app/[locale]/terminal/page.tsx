import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CopyButton from "@/components/CopyButton";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: { absolute: t("seo.terminalTitle") },
    description: t("seo.terminalDesc"),
    alternates: pageAlternates(locale, "/terminal"),
  };
}

/* 설치 명령은 Claude Code 공식 문서(code.claude.com/docs/en/setup)의 네이티브 인스톨러다.
   Node.js는 필요 없다. 문서가 바뀌면 이 두 줄을 먼저 확인할 것. */
const CMD_MAC = "curl -fsSL https://claude.ai/install.sh | bash";
const CMD_WIN = "irm https://claude.ai/install.ps1 | iex";
const CMD_CHECK = "claude --version";
const CMD_START = "claude";

/** 글자 없는 일러스트 — 3개 언어가 같은 이미지를 공유한다(설명은 전부 HTML) */
function Shot({ n, alt }: { n: number; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/terminal/step${n}.webp`}
      alt={alt}
      width={880}
      height={495}
      loading={n <= 2 ? "eager" : "lazy"}
      className="mb-4 w-full rounded-xl border border-line bg-surface"
    />
  );
}

function Cmd({ label, code }: { label: string; code: string }) {
  return (
    <div className="my-3">
      <p className="mb-1 text-xs font-semibold text-ink-soft">{label}</p>
      <div className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3">
        <code className="min-w-0 flex-1 break-all font-mono-plex text-xs leading-relaxed">
          {code}
        </code>
        <CopyButton text={code} />
      </div>
    </div>
  );
}

export default async function TerminalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terminal");
  const tn = await getTranslations();

  const step = "mb-10";
  const h2 = "mb-3 font-display text-xl font-bold";
  const body = "text-[15px] leading-relaxed";

  return (
    <article className="mx-auto max-w-2xl py-10">
      <h1 className="mb-3 font-display text-3xl font-bold">{t("title")}</h1>
      <p className="mb-10 text-[15px] leading-relaxed text-ink-soft">{t("lead")}</p>

      <section className={step}>
        <h2 className={h2}>{t("whatTitle")}</h2>
        <Shot n={1} alt={t("whatTitle")} />
        <p className={body}>{t("whatBody")}</p>
      </section>

      <section className={step}>
        <h2 className={h2}>{t("needTitle")}</h2>
        <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed">
          <li className="text-accent">{t("needPlan")}</li>
          <li>{t("needOs")}</li>
          <li>{t("needNode")}</li>
        </ul>
      </section>

      <section className={step}>
        <h2 className={h2}>{t("macTitle")}</h2>
        <Shot n={2} alt={t("macTitle")} />
        <p className={body}>{t("macOpen")}</p>
      </section>

      <section className={step}>
        <h2 className={h2}>{t("winTitle")}</h2>
        <Shot n={3} alt={t("winTitle")} />
        <p className={body}>{t("winOpen")}</p>
        <p className="mt-2 text-sm text-ink-soft">{t("winNote")}</p>
      </section>

      <section className={step}>
        <h2 className={h2}>{t("installTitle")}</h2>
        <Shot n={4} alt={t("installTitle")} />
        <p className={body}>{t("installBody")}</p>
        <Cmd label={t("installMac")} code={CMD_MAC} />
        <Cmd label={t("installWin")} code={CMD_WIN} />
        <p className="text-sm text-ink-soft">{t("installWait")}</p>
      </section>

      <section className={step}>
        <h2 className={h2}>{t("checkTitle")}</h2>
        <Shot n={5} alt={t("checkTitle")} />
        <p className={body}>{t("checkBody")}</p>
        <Cmd label={t("checkTitle")} code={CMD_CHECK} />
        <p className="rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed">
          {t("checkFail")}
        </p>
      </section>

      <section className={step}>
        <h2 className={h2}>{t("loginTitle")}</h2>
        <Shot n={6} alt={t("loginTitle")} />
        <p className={body}>{t("loginBody")}</p>
        <Cmd label={t("loginTitle")} code={CMD_START} />
      </section>

      <section className={step}>
        <h2 className={h2}>{t("folderTitle")}</h2>
        <Shot n={7} alt={t("folderTitle")} />
        <p className={body}>{t("folderBody")}</p>
        <p className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed">
          {t("folderMac")}
        </p>
        <p className="mt-2 rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed">
          {t("folderWin")}
        </p>
      </section>

      <section className={step}>
        <h2 className={h2}>{t("skillTitle")}</h2>
        <Shot n={8} alt={t("skillTitle")} />
        <p className={body}>{t("skillBody")}</p>
        <Link
          href="/skills"
          className="mt-4 inline-block rounded-xl bg-accent px-5 py-3 font-semibold text-accent-ink"
        >
          {t("skillCta")} →
        </Link>
      </section>

      <section>
        <h2 className={h2}>{t("stuckTitle")}</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed">
          <li>{t("stuck1")}</li>
          <li>{t("stuck2")}</li>
          <li>{t("stuck3")}</li>
          <li>{t("stuck4")}</li>
        </ul>
        <p className="text-sm leading-relaxed text-ink-soft">{t("stuckAsk")}</p>
        <p className="mt-4">
          <Link href="/guide" className="text-accent underline">
            {tn("nav.guide")} →
          </Link>
        </p>
      </section>
    </article>
  );
}
