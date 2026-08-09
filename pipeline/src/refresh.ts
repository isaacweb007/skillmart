import type { Octokit } from "@octokit/rest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { rankScore } from "./lib/score.js";
import { trendingDelta } from "./lib/trend.js";
import { snapshotMetrics } from "./publish.js";

interface TrackedSkill {
  id: string;
  repo_full_name: string;
  ai_score: number | null;
  last_commit_at: string | null;
}

/** 이번 런 발굴에 포함되지 않은 visible 스킬들의 지표 갱신 + 삭제 감지 */
export async function refreshUndiscovered(
  db: SupabaseClient,
  octokit: Octokit,
  discoveredRepos: Set<string>,
): Promise<{ refreshed: number; hidden: number }> {
  const { data, error } = await db
    .from("skills")
    .select("id, repo_full_name, ai_score, last_commit_at")
    .eq("status", "visible");
  if (error) throw new Error(`refresh 대상 조회 실패: ${error.message}`);

  const byRepo = new Map<string, TrackedSkill[]>();
  for (const row of data as TrackedSkill[]) {
    if (discoveredRepos.has(row.repo_full_name)) continue;
    const list = byRepo.get(row.repo_full_name) ?? [];
    list.push(row);
    byRepo.set(row.repo_full_name, list);
  }

  let refreshed = 0;
  let hidden = 0;
  for (const [fullName, skills] of byRepo) {
    const [owner, repo] = fullName.split("/");
    try {
      const { data: r } = await octokit.repos.get({ owner, repo });
      for (const s of skills) {
        const { error: upErr } = await db
          .from("skills")
          .update({
            stars: r.stargazers_count,
            forks: r.forks_count,
            last_commit_at: r.pushed_at ?? s.last_commit_at,
            rank_score: rankScore(s.ai_score, r.stargazers_count, r.pushed_at ?? s.last_commit_at),
            updated_at: new Date().toISOString(),
          })
          .eq("id", s.id);
        if (upErr) throw new Error(`skills 지표 갱신 실패: ${upErr.message}`);
        await snapshotMetrics(db, s.id, r.stargazers_count);
        refreshed++;
      }
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 404 || status === 451) {
        // 저장소 삭제·비공개·차단 → 노출 해제 (데이터 보존)
        const { error: hideErr } = await db
          .from("skills")
          .update({ status: "hidden", updated_at: new Date().toISOString() })
          .eq("repo_full_name", fullName)
          .eq("status", "visible");
        if (hideErr) console.error(`hidden 처리 실패 ${fullName}: ${hideErr.message}`);
        else hidden += skills.length;
      } else {
        console.warn(`지표 갱신 건너뜀 ${fullName}: ${(e as Error).message}`);
      }
    }
  }
  return { refreshed, hidden };
}

/** visible 전체의 trending_delta 재계산 (오늘 포함 최근 8일 스냅샷 기반) */
export async function updateTrending(db: SupabaseClient): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - 8 * 86_400_000).toISOString().slice(0, 10);

  const { data: skills, error } = await db
    .from("skills")
    .select("id, stars")
    .eq("status", "visible");
  if (error) throw new Error(`trending 대상 조회 실패: ${error.message}`);

  const { data: snaps, error: snapErr } = await db
    .from("skill_metrics_daily")
    .select("skill_id, date, stars")
    .gte("date", since);
  if (snapErr) throw new Error(`스냅샷 조회 실패: ${snapErr.message}`);

  const bySkill = new Map<string, { date: string; stars: number }[]>();
  for (const s of snaps as { skill_id: string; date: string; stars: number }[]) {
    const list = bySkill.get(s.skill_id) ?? [];
    list.push({ date: s.date, stars: s.stars });
    bySkill.set(s.skill_id, list);
  }

  let updated = 0;
  for (const s of skills as { id: string; stars: number }[]) {
    const delta = trendingDelta(bySkill.get(s.id) ?? [], s.stars, today);
    const { error: upErr } = await db.from("skills").update({ trending_delta: delta }).eq("id", s.id);
    if (upErr) console.error(`trending 갱신 실패 ${s.id}: ${upErr.message}`);
    else updated++;
  }
  return updated;
}
