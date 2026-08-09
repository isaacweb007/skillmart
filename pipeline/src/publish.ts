import type { SupabaseClient } from "@supabase/supabase-js";
import type { Analysis } from "./claude/analyze.js";
import type { Candidate } from "./github/discover.js";
import { rankScore } from "./lib/score.js";

export interface ExistingSkill {
  id: string;
  repo_full_name: string;
  path: string;
  content_hash: string;
  status: string;
  slug: string;
  analysis_attempts: number;
  ai_score: number | null;
  is_official: boolean;
}

export function skillKey(repoFullName: string, path: string): string {
  return `${repoFullName}::${path}`;
}

export async function loadExisting(db: SupabaseClient): Promise<Map<string, ExistingSkill>> {
  const map = new Map<string, ExistingSkill>();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from("skills")
      .select("id, repo_full_name, path, content_hash, status, slug, analysis_attempts, ai_score, is_official")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`skills 조회 실패: ${error.message}`);
    for (const row of data as ExistingSkill[]) map.set(skillKey(row.repo_full_name, row.path), row);
    if (data.length < pageSize) break;
  }
  return map;
}

export interface PublishInput {
  candidate: Candidate;
  hash: string;
  slug: string;
  status: string;
  attempts: number;
  analysis: Analysis | null;
  aiScoreForRank: number | null;
}

export async function upsertSkill(db: SupabaseClient, p: PublishInput): Promise<string> {
  const a = p.analysis;
  const row = {
    repo_full_name: p.candidate.repoFullName,
    path: p.candidate.path,
    slug: p.slug,
    source_url: p.candidate.sourceUrl,
    license: p.candidate.license,
    stars: p.candidate.stars,
    forks: p.candidate.forks,
    last_commit_at: p.candidate.lastCommitAt,
    content_hash: p.hash,
    status: p.status,
    analysis_attempts: p.attempts,
    is_official: p.candidate.isOfficial,
    rank_score: rankScore(p.aiScoreForRank, p.candidate.stars, p.candidate.lastCommitAt),
    updated_at: new Date().toISOString(),
    ...(a && {
      category: a.category,
      tags: a.tags,
      difficulty: a.difficulty,
      ai_score: a.ai_score,
      install_command: a.install_command,
      ai_review_ko: a.reviews.ko,
      ai_review_vi: a.reviews.vi,
      ai_review_en: a.reviews.en,
    }),
  };
  const { data, error } = await db
    .from("skills")
    .upsert(row, { onConflict: "repo_full_name,path" })
    .select("id")
    .single();
  if (error) throw new Error(`skills upsert 실패 (${p.slug}): ${error.message}`);
  return (data as { id: string }).id;
}

export async function upsertTranslations(db: SupabaseClient, skillId: string, a: Analysis): Promise<void> {
  const rows = (["ko", "vi", "en"] as const).map((locale) => ({
    skill_id: skillId,
    locale,
    name: a.translations[locale].name,
    one_liner: a.translations[locale].one_liner,
    description_md: a.translations[locale].description_md,
    install_guide_md: a.translations[locale].install_guide_md,
  }));
  const { error } = await db.from("skill_translations").upsert(rows, { onConflict: "skill_id,locale" });
  if (error) throw new Error(`skill_translations upsert 실패: ${error.message}`);
}

export async function snapshotMetrics(db: SupabaseClient, skillId: string, stars: number): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const { error } = await db
    .from("skill_metrics_daily")
    .upsert({ skill_id: skillId, date, stars }, { onConflict: "skill_id,date" });
  if (error) throw new Error(`skill_metrics_daily upsert 실패: ${error.message}`);
}
