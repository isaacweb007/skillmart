import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MODEL } from "./analyze.js";

export interface CollectionInput {
  slug: string;
  name: string;
  category: string;
  one_liner: string;
}

export interface GeneratedCollection {
  slug: string;
  skill_slugs: string[];
  translations: Record<"ko" | "vi" | "en", { title: string; description: string }>;
}

const localeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description"],
  properties: { title: { type: "string" }, description: { type: "string" } },
} as const;

export const COLLECTIONS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["collections"],
  properties: {
    collections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["slug", "skill_slugs", "translations"],
        properties: {
          slug: { type: "string" },
          skill_slugs: { type: "array", items: { type: "string" } },
          translations: {
            type: "object",
            additionalProperties: false,
            required: ["ko", "vi", "en"],
            properties: { ko: localeSchema, vi: localeSchema, en: localeSchema },
          },
        },
      },
    },
  },
} as const;

export function buildCollectionsPrompt(skills: CollectionInput[]): string {
  const catalog = skills
    .map((s) => `${s.slug} | ${s.category} | ${s.name} | ${s.one_liner}`)
    .join("\n");
  return `당신은 Claude Code 스킬 마켓 "클로드스킬마트"의 큐레이터다. 아래 카탈로그에서 상황별 추천 세트를 만들어 스키마에 맞는 JSON만 출력하라.

규칙:
- 세트 6~10개. 각 세트는 skill_slugs 4~8개 (반드시 카탈로그에 있는 slug만).
- 세트의 주제는 사용자의 "상황" 중심 — 예: 발표 자료 만들 때, 블로그 쓸 때, 코드 리뷰할 때, 데이터 정리할 때.
- slug: 영어 kebab-case (예: "presentation-day").
- translations.{ko,vi,en}: title은 그 언어로 매력적인 상황형 제목(예: "발표 자료 만드는 날"), description은 이 세트로 무엇을 해낼 수 있는지 2~3문장.
- 같은 스킬이 여러 세트에 들어가도 된다. 어색한 억지 조합은 만들지 마라.

<catalog>
${catalog}
</catalog>`;
}

export function validateCollections(
  raw: GeneratedCollection[],
  validSlugs: Set<string>,
): GeneratedCollection[] {
  return raw
    .map((c) => ({ ...c, skill_slugs: c.skill_slugs.filter((s) => validSlugs.has(s)) }))
    .filter((c) => c.skill_slugs.length >= 3)
    .slice(0, 10);
}

export async function generateCollections(
  client: Anthropic,
  skills: CollectionInput[],
): Promise<{ collections: GeneratedCollection[]; costUsd: number }> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { format: { type: "json_schema" as const, schema: COLLECTIONS_SCHEMA } },
    messages: [{ role: "user" as const, content: buildCollectionsPrompt(skills) }],
  });
  const cost =
    (response.usage.input_tokens * 5 + response.usage.output_tokens * 25) / 1_000_000;
  if (response.stop_reason === "refusal") return { collections: [], costUsd: cost };
  let text = "";
  for (const block of response.content) {
    if (block.type === "text") {
      text = block.text;
      break;
    }
  }
  try {
    const parsed = JSON.parse(text) as { collections: GeneratedCollection[] };
    return {
      collections: validateCollections(parsed.collections, new Set(skills.map((s) => s.slug))),
      costUsd: cost,
    };
  } catch {
    console.error("컬렉션 JSON 파싱 실패");
    return { collections: [], costUsd: cost };
  }
}

export async function publishCollections(
  db: SupabaseClient,
  generated: GeneratedCollection[],
): Promise<number> {
  if (generated.length === 0) return 0;
  const { data: skillRows, error: skillErr } = await db
    .from("skills")
    .select("id, slug")
    .eq("status", "visible");
  if (skillErr) throw new Error(`컬렉션용 스킬 조회 실패: ${skillErr.message}`);
  const idBySlug = new Map((skillRows as { id: string; slug: string }[]).map((r) => [r.slug, r.id]));

  // 백업: 삭제 전 기존 비고정 컬렉션 보존 (전멸 시 복원용)
  const { data: backup, error: bakErr } = await db
    .from("collections")
    .select("slug, skill_ids, collection_translations(locale, title, description)")
    .eq("is_pinned", false);
  if (bakErr) throw new Error(`컬렉션 백업 실패: ${bakErr.message}`);

  const { error: delErr } = await db.from("collections").delete().eq("is_pinned", false);
  if (delErr) throw new Error(`기존 컬렉션 삭제 실패: ${delErr.message}`);

  const insertOne = async (
    slug: string,
    skillIds: string[],
    translations: { locale: string; title: string; description: string }[],
  ): Promise<boolean> => {
    const { data: row, error: insErr } = await db
      .from("collections")
      .insert({ slug, skill_ids: skillIds })
      .select("id")
      .single();
    if (insErr) {
      console.error(`컬렉션 삽입 실패 ${slug}: ${insErr.message}`);
      return false;
    }
    const collectionId = (row as { id: string }).id;
    const { error: trErr } = await db
      .from("collection_translations")
      .insert(translations.map((t) => ({ ...t, collection_id: collectionId })));
    if (trErr) {
      console.error(`컬렉션 번역 삽입 실패 ${slug}: ${trErr.message}`);
      await db.from("collections").delete().eq("id", collectionId); // 고아 방지 보상
      return false;
    }
    return true;
  };

  let inserted = 0;
  for (const c of generated) {
    const skillIds = c.skill_slugs.map((s) => idBySlug.get(s)).filter((x): x is string => !!x);
    if (skillIds.length < 3) continue;
    const translations = (["ko", "vi", "en"] as const).map((locale) => ({
      locale,
      title: c.translations[locale].title,
      description: c.translations[locale].description,
    }));
    if (await insertOne(c.slug, skillIds, translations)) inserted++;
  }

  // 전멸 시 백업 복원 — 컬렉션 0개 상태 방지
  if (inserted === 0 && backup && backup.length > 0) {
    console.error("신규 컬렉션 전멸 — 백업 복원 시도");
    let restored = 0;
    for (const b of backup as {
      slug: string;
      skill_ids: string[];
      collection_translations: { locale: string; title: string; description: string }[];
    }[]) {
      if (await insertOne(b.slug, b.skill_ids, b.collection_translations)) restored++;
    }
    console.error(`백업 복원 ${restored}/${backup.length}세트`);
  }
  return inserted;
}
