import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORIES, MODEL } from "./analyze.js";

/** 웹의 큐레이션 시드 40개 이름 — 새 문장이 이것과 겹치지 않게 제외 목록으로 넘긴다.
 *  단일 진실 소스는 apps/web/lib/prompts.ts다(워크스페이스가 달라 import하지 않는다).
 *  시드 목록은 고정이라 드리프트 위험이 낮다. */
export const SEED_CMDS = [
  "eli5", "tldr", "steelman", "devil", "pros-cons", "stepbystep",
  "checklist", "template", "examples", "analogy", "critique", "improve",
  "shorter", "expand", "simplify", "tone", "brainstorm", "outline",
  "counterexample", "assumptions", "questions", "compare", "risks", "persona",
  "5whys", "rewrite-formal", "factcheck", "next-steps", "rephrase", "summary-bullets",
  "blueprint", "hooks", "ghost", "proofread", "tweet", "score",
  "audience", "story", "flashcards", "negotiate",
] as const;

/** ponytail: 하루 2개씩만 늘리고 DB 누적 40개에서 멈춘다(기본 40 + 증분 40 = 최대 80).
 *  무한히 쌓으면 비슷한 문장이 겹쳐 목록의 값이 떨어진다. 상한을 늘리려면 이 값만 올린다. */
export const DAILY_NEW = 2;
export const MAX_STORED = 40;

export interface GeneratedPrompt {
  cmd: string;
  category: string;
  ko: { label: string; example: string };
  vi: { label: string; example: string };
  en: { label: string; example: string };
}

const localeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["label", "example"],
  properties: { label: { type: "string" }, example: { type: "string" } },
} as const;

export const PROMPTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["prompts"],
  properties: {
    prompts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["cmd", "category", "ko", "vi", "en"],
        properties: {
          cmd: { type: "string" },
          category: { type: "string", enum: CATEGORIES },
          ko: localeSchema,
          vi: localeSchema,
          en: localeSchema,
        },
      },
    },
  },
} as const;

export function buildPromptsPrompt(existingCmds: string[]): string {
  return `당신은 Claude 사용자를 위한 "바로 붙여넣어 쓰는 문장" 목록을 관리하는 편집자다. 새 문장 ${DAILY_NEW}개를 만들어 스키마에 맞는 JSON만 출력하라.

규칙:
- cmd: 영어 kebab-case 한 단어~두 단어 (예: "rubber-duck"). 아래 <existing> 목록과 절대 겹치지 마라. 뜻이 비슷한 것도 만들지 마라.
- category: 주어진 enum 중 이 문장이 대신하는 일에 가장 가까운 코너.
- label: 그 언어로 이 문장이 무엇을 해주는지 4~10자 정도의 짧은 이름 (예: "3줄 요약").
- example: 사용자가 **그대로 복사해 Claude에 붙여넣으면 작동하는 완성된 문장**. 명령어 접두사(/)를 넣지 마라. 필요하면 끝에 콜론을 붙여 붙여넣을 내용을 이어쓰게 해도 된다.
- 일반적인 사무·학습·창작 상황에서 실제로 자주 쓰는 것만. 억지스럽거나 지나치게 특수한 것은 만들지 마라.
- 세 언어 모두 그 언어 사용자가 자연스럽게 쓰는 표현으로. 한국어를 직역하지 마라.

<existing>
${existingCmds.join(", ")}
</existing>`;
}

const CMD_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** 스키마가 못 잡는 것을 걸러낸다: cmd 형식, 중복, 빈 문자열, 명령어 접두사 혼입 */
export function validatePrompts(
  raw: GeneratedPrompt[],
  existingCmds: Set<string>,
): GeneratedPrompt[] {
  const out: GeneratedPrompt[] = [];
  const seen = new Set(existingCmds);
  for (const p of raw) {
    const cmd = (p.cmd ?? "").trim().replace(/^\//, "").toLowerCase();
    if (!CMD_RE.test(cmd) || seen.has(cmd)) continue;
    const locales = [p.ko, p.vi, p.en];
    if (locales.some((l) => !l?.label?.trim() || !l?.example?.trim())) continue;
    if (locales.some((l) => l.example.trimStart().startsWith("/"))) continue;
    seen.add(cmd);
    out.push({ ...p, cmd });
    if (out.length >= DAILY_NEW) break;
  }
  return out;
}

export async function generatePrompts(
  client: Anthropic,
  existingCmds: string[],
): Promise<{ prompts: GeneratedPrompt[]; costUsd: number }> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    output_config: { format: { type: "json_schema" as const, schema: PROMPTS_SCHEMA } },
    messages: [{ role: "user" as const, content: buildPromptsPrompt(existingCmds) }],
  });
  const cost = (response.usage.input_tokens * 5 + response.usage.output_tokens * 25) / 1_000_000;
  if (response.stop_reason === "refusal") return { prompts: [], costUsd: cost };
  let text = "";
  for (const block of response.content) {
    if (block.type === "text") {
      text = block.text;
      break;
    }
  }
  try {
    const parsed = JSON.parse(text) as { prompts: GeneratedPrompt[] };
    return { prompts: validatePrompts(parsed.prompts, new Set(existingCmds)), costUsd: cost };
  } catch {
    console.error("프롬프트 JSON 파싱 실패");
    return { prompts: [], costUsd: cost };
  }
}

export async function publishPrompts(
  db: SupabaseClient,
  prompts: GeneratedPrompt[],
): Promise<number> {
  if (prompts.length === 0) return 0;
  const { error } = await db.from("daily_prompts").insert(
    prompts.map((p) => ({
      cmd: p.cmd,
      category: p.category,
      ko_label: p.ko.label,
      ko_example: p.ko.example,
      vi_label: p.vi.label,
      vi_example: p.vi.example,
      en_label: p.en.label,
      en_example: p.en.example,
    })),
  );
  if (error) throw new Error(`daily_prompts 삽입 실패: ${error.message}`);
  return prompts.length;
}
