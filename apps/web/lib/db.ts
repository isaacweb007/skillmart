import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

export const PAGE_SIZE = 20;

export interface SkillListItem {
  id: string;
  slug: string;
  category: string;
  difficulty: string | null;
  ai_score: number | null;
  stars: number;
  is_official: boolean;
  created_at: string;
  rank_score: number;
  name: string;
  one_liner: string;
}

export interface SkillDetail extends SkillListItem {
  forks: number;
  last_commit_at: string | null;
  source_url: string;
  license: string | null;
  install_command: string | null;
  description_md: string;
  install_guide_md: string;
  ai_review: string | null;
}

const LIST_COLS =
  "id, slug, category, difficulty, ai_score, stars, is_official, created_at, rank_score";

interface TranslationRow {
  locale: string;
  name: string;
  one_liner: string;
  description_md?: string;
  install_guide_md?: string;
}

function pickTranslation(rows: TranslationRow[], locale: string): TranslationRow | null {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "en") ?? rows[0] ?? null;
}

function toListItem(row: Record<string, unknown>, locale: string): SkillListItem | null {
  const tr = pickTranslation((row.skill_translations as TranslationRow[]) ?? [], locale);
  if (!tr) return null;
  const { skill_translations: _drop, ...rest } = row;
  return { ...(rest as Omit<SkillListItem, "name" | "one_liner">), name: tr.name, one_liner: tr.one_liner };
}

export async function getVisibleCount(): Promise<number> {
  const { count, error } = await db
    .from("skills")
    .select("id", { count: "exact", head: true })
    .eq("status", "visible");
  if (error) throw new Error(`skills count 실패: ${error.message}`);
  return count ?? 0;
}

export async function getHomeSkills(
  locale: string,
): Promise<{ top: SkillListItem[]; fresh: SkillListItem[] }> {
  const base = () =>
    db
      .from("skills")
      .select(`${LIST_COLS}, skill_translations(locale, name, one_liner)`)
      .eq("status", "visible");
  const [top, fresh] = await Promise.all([
    base().order("rank_score", { ascending: false }).limit(8),
    base().order("created_at", { ascending: false }).limit(8),
  ]);
  if (top.error) throw new Error(`top skills 조회 실패: ${top.error.message}`);
  if (fresh.error) throw new Error(`fresh skills 조회 실패: ${fresh.error.message}`);
  const flat = (rows: Record<string, unknown>[]) =>
    rows.map((r) => toListItem(r, locale)).filter((x): x is SkillListItem => x !== null);
  return { top: flat(top.data), fresh: flat(fresh.data) };
}

/* PostgREST or() 문법의 구분자와 충돌하는 문자를 검색어에서 제거하고 like 와일드카드를 이스케이프 */
function sanitizeQuery(q: string): string {
  return q.replace(/[,()]/g, " ").replace(/[%_]/g, (m) => `\\${m}`).trim();
}

export async function searchSkills(opts: {
  locale: string;
  q?: string;
  category?: string;
  difficulty?: string;
  sort: "rank" | "new";
  page: number;
}): Promise<{ items: SkillListItem[]; total: number }> {
  let query = db
    .from("skills")
    .select(`${LIST_COLS}, skill_translations!inner(locale, name, one_liner)`, {
      count: "exact",
    })
    .eq("status", "visible")
    .eq("skill_translations.locale", opts.locale);
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.difficulty) query = query.eq("difficulty", opts.difficulty);
  if (opts.q && opts.q.trim()) {
    const q = sanitizeQuery(opts.q);
    if (q) {
      query = query.or(`name.ilike.%${q}%,one_liner.ilike.%${q}%,description_md.ilike.%${q}%`, {
        referencedTable: "skill_translations",
      });
    }
  }
  query =
    opts.sort === "new"
      ? query.order("created_at", { ascending: false })
      : query.order("rank_score", { ascending: false });
  const from = (opts.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`skills 검색 실패: ${error.message}`);
  const items = (data as Record<string, unknown>[])
    .map((r) => toListItem(r, opts.locale))
    .filter((x): x is SkillListItem => x !== null);
  return { items, total: count ?? 0 };
}

export const getSkillBySlug = cache(
  async (slug: string, locale: string): Promise<SkillDetail | null> => {
    const { data, error } = await db
      .from("skills")
      .select(
        `${LIST_COLS}, forks, last_commit_at, source_url, license, install_command,
         ai_review_ko, ai_review_vi, ai_review_en,
         skill_translations(locale, name, one_liner, description_md, install_guide_md)`,
      )
      .eq("status", "visible")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(`skill 상세 조회 실패: ${error.message}`);
    if (!data) return null;
    const tr = pickTranslation((data.skill_translations as TranslationRow[]) ?? [], locale);
    if (!tr) return null;
    const reviews: Record<string, string | null> = {
      ko: data.ai_review_ko,
      vi: data.ai_review_vi,
      en: data.ai_review_en,
    };
    const { skill_translations: _t, ai_review_ko: _k, ai_review_vi: _v, ai_review_en: _e, ...rest } = data;
    return {
      ...(rest as Omit<SkillDetail, "name" | "one_liner" | "description_md" | "install_guide_md" | "ai_review">),
      name: tr.name,
      one_liner: tr.one_liner,
      description_md: tr.description_md ?? "",
      install_guide_md: tr.install_guide_md ?? "",
      ai_review: reviews[locale] ?? reviews.en ?? null,
    };
  }
);
