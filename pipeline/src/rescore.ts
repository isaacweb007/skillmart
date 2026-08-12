import Anthropic from "@anthropic-ai/sdk";
import { Octokit } from "@octokit/rest";
import {
  buildBatchRequest, costUsd, maxItemsForBudget, runAnalysisBatch,
} from "./claude/analyze.js";
import { env } from "./config.js";
import { createDb } from "./db.js";
import { fetchRaw, type Candidate } from "./github/discover.js";
import { nextStatus } from "./lib/score.js";
import { contentHash } from "./lib/skillmd.js";
import { upsertSkill, upsertTranslations } from "./publish.js";

/** 이미 분석된 스킬 전체를 새 루브릭으로 다시 채점한다. 일일 런(발굴·지표·영상)과 무관한 단발 도구.
 *  updated_at 오래된 순으로 잘라 처리하므로 --max-cost로 끊어 여러 번 돌리면 이어서 진행된다.
 *  실행: npm run --workspace pipeline rescore -- --max-cost 45 */

interface Row {
  id: string;
  repo_full_name: string;
  path: string;
  slug: string;
  stars: number;
  forks: number;
  license: string | null;
  source_url: string;
  last_commit_at: string | null;
  is_official: boolean;
}

async function main() {
  const maxCostIdx = process.argv.indexOf("--max-cost");
  const maxCostUsd = maxCostIdx > -1 ? Number(process.argv[maxCostIdx + 1]) : 3;
  if (!Number.isFinite(maxCostUsd) || maxCostUsd <= 0)
    throw new Error(`--max-cost 값이 잘못됨: ${maxCostUsd}`);

  const db = createDb();
  const octokit = new Octokit({ auth: env("GITHUB_TOKEN") });
  const anthropic = new Anthropic();

  const rows: Row[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from("skills")
      .select("id, repo_full_name, path, slug, stars, forks, license, source_url, last_commit_at, is_official")
      .not("ai_score", "is", null)
      .order("updated_at", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`skills 조회 실패: ${error.message}`);
    rows.push(...(data as Row[]));
    if (data.length < pageSize) break;
  }

  const targets = rows.slice(0, maxItemsForBudget(maxCostUsd));
  console.log(`재채점 대상 ${targets.length}/${rows.length}건 (예산 $${maxCostUsd})`);

  // 원문 재수집 — 404·삭제는 건너뛴다(삭제 감지·hidden 처리는 일일 런 refresh 담당)
  const items: { row: Row; candidate: Candidate; hash: string }[] = [];
  for (const row of targets) {
    const [owner, name] = row.repo_full_name.split("/");
    const raw = await fetchRaw(octokit, owner, name, row.path);
    if (!raw) {
      console.warn(`원문 없음(건너뜀): ${row.repo_full_name}/${row.path}`);
      continue;
    }
    items.push({
      row,
      hash: contentHash(raw),
      candidate: {
        repoFullName: row.repo_full_name,
        path: row.path,
        raw,
        stars: row.stars,
        forks: row.forks,
        lastCommitAt: row.last_commit_at,
        license: row.license,
        sourceUrl: row.source_url,
        isOfficial: row.is_official,
      },
    });
  }
  console.log(`원문 수집: ${items.length}건`);

  const requests = items.map((it, i) => buildBatchRequest(it.candidate, `r${i}`));
  const outcomes = await runAnalysisBatch(anthropic, requests);
  let cost = 0;
  for (const o of outcomes.values()) cost += costUsd(o.inputTokens, o.outputTokens);

  let ok = 0, failed = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const outcome = outcomes.get(`r${i}`);
    const analysis = outcome?.analysis ?? null;
    if (!analysis) {
      // 실패는 행을 건드리지 않는다 — 기존 점수·상태 유지가 pending 전환보다 낫다
      failed++;
      console.warn(`재채점 실패(기존 유지) ${it.row.repo_full_name}/${it.row.path}: ${outcome?.error ?? "결과 없음"}`);
      continue;
    }
    const ns = nextStatus(true, analysis.ai_score, it.row.is_official, 0);
    try {
      const skillId = await upsertSkill(db, {
        candidate: it.candidate, hash: it.hash, slug: it.row.slug,
        status: ns.status, attempts: 0, analysis, aiScoreForRank: analysis.ai_score,
      });
      await upsertTranslations(db, skillId, analysis);
      ok++;
    } catch (e) {
      failed++;
      console.error((e as Error).message);
    }
  }
  console.log(`재채점 완료 — 성공 ${ok}, 실패 ${failed}, 비용 $${cost.toFixed(2)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
