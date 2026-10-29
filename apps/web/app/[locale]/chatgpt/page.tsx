import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CopyButton from "@/components/CopyButton";
import CopyChip from "@/components/CopyChip";
import PromptTabs from "@/components/PromptTabs";
import {
  buildCustomInstructions, GPT_CATS, GPT_CMDS, GPT_SOURCES, STUDY_CMDS, type GptCat,
} from "@/lib/chatgpt-prompts";
import { pageAlternates } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: { absolute: t("seo.gptTitle") },
    description: t("seo.gptDesc"),
    alternates: pageAlternates(locale, "/chatgpt"),
  };
}

export default async function ChatgptPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const loc = (locale === "vi" ? "vi" : locale === "en" ? "en" : "ko") as "ko" | "vi" | "en";
  const instructions = buildCustomInstructions(loc, (cat: GptCat) => t(`gptPage.cat.${cat}`));

  return (
    <div className="py-10">
      <h1 className="mb-3 font-display text-3xl font-semibold">{t("gptPage.title")}</h1>
      <p className="mb-6 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{t("gptPage.lead")}</p>
      <PromptTabs active="gpt" />

      {/* 맞춤 지침 — 이 페이지의 핵심 장치: 한 번 등록하면 /이름이 진짜 명령어가 된다 */}
      <section className="mb-12 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-1 font-display text-xl font-semibold">{t("gptPage.customTitle")}</h2>
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-ink-soft">{t("gptPage.customLead")}</p>
        <div className="flex items-start gap-2 rounded-lg border border-line bg-bg p-3">
          <pre className="max-h-64 min-w-0 flex-1 overflow-auto font-mono-plex text-xs leading-relaxed whitespace-pre-wrap">{instructions}</pre>
          <CopyButton text={instructions} />
        </div>
      </section>

      {GPT_CATS.map((cat) => (
        <section key={cat} className="mb-10">
          <h2 className="mb-4 font-display text-xl font-semibold">{t(`gptPage.cat.${cat}`)}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {GPT_CMDS.filter((c) => c.cat === cat).map((c) => (
              <li key={c.cmd} className="flex items-baseline gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
                <CopyChip text={c.cmd} title={t("prompts.copyCmd")} />
                <span className="min-w-0 text-sm leading-relaxed text-ink-muted">{c[loc]}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mb-10">
        <h2 className="mb-1 font-display text-xl font-semibold">{t("gptPage.studyTitle")}</h2>
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-ink-soft">{t("gptPage.studyLead")}</p>
        <ol className="space-y-3">
          {STUDY_CMDS.map((s, i) => {
            const text = s[loc];
            return (
              <li key={s.cmd} className="rounded-xl border border-line bg-surface p-4">
                <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono-plex text-xs text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                  <CopyChip text={s.cmd} title={t("prompts.copyCmd")} />
                  <h3 className="font-display font-semibold">{text.name}</h3>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-ink-muted">{text.desc}</p>
                <div className="mb-2 flex items-start gap-2 rounded-lg border border-line bg-bg p-3">
                  <p className="min-w-0 flex-1 font-mono-plex text-xs leading-relaxed">{text.example}</p>
                  <CopyButton text={text.example} />
                </div>
                <p className="border-l-2 border-line-strong pl-3 text-xs leading-relaxed text-ink-soft">{text.tip}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 출처 크레딧 — 남의 정리를 가져온 곳은 반드시 밝힌다 */}
      <p className="text-xs leading-relaxed text-ink-tertiary">
        {t("gptPage.source")}:{" "}
        <a href={GPT_SOURCES.think.url} rel="noopener" className="underline hover:text-ink-soft">
          {GPT_SOURCES.think.author} — {GPT_SOURCES.think.title}
        </a>
        {" · "}
        <a href={GPT_SOURCES.study.url} rel="noopener" className="underline hover:text-ink-soft">
          {GPT_SOURCES.study.author} — {GPT_SOURCES.study.title}
        </a>
      </p>
    </div>
  );
}
