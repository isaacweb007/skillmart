import Anthropic from "@anthropic-ai/sdk";
import { Octokit } from "@octokit/rest";
import { buildBatchRequest, costUsd, runAnalysisBatch, type Analysis } from "./claude/analyze.js";
import { env } from "./config.js";
import { createDb } from "./db.js";
import { discover, type Candidate } from "./github/discover.js";
import { needsAnalysis, nextStatus } from "./lib/score.js";
import { contentHash, makeSlug, parseSkillMd, type SkillMeta } from "./lib/skillmd.js";
import {
  loadExisting, skillKey, snapshotMetrics, upsertSkill, upsertTranslations,
  type ExistingSkill,
} from "./publish.js";
import { refreshUndiscovered, updateTrending } from "./refresh.js";
import { generateCollections, publishCollections, type CollectionInput } from "./claude/collections.js";

interface Item {
  candidate: Candidate;
  meta: SkillMeta;
  hash: string;
  ex: ExistingSkill | undefined;
}

async function main() {
  const limitIdx = process.argv.indexOf("--limit");
  const limit = limitIdx > -1 ? Number(process.argv[limitIdx + 1]) : 1000;
  if (!Number.isFinite(limit) || limit < 1) throw new Error(`--limit 값이 잘못됨: ${limit}`);

  const db = createDb();
  const octokit = new Octokit({ auth: env("GITHUB_TOKEN") });
  const anthropic = new Anthropic(); // ANTHROPIC_API_KEY 자동 인식

  const { data: run, error: runErr } = await db.from("pipeline_runs").insert({}).select("id").single();
  if (runErr) throw new Error(`pipeline_runs 생성 실패: ${runErr.message}`);
  const runId = (run as { id: string }).id;

  let discovered = 0, analyzed = 0, published = 0, errors = 0, cost = 0;
  let notes = "";
  try {
    // 지표 갱신 대상(변경 없음 포함)도 있으므로 발굴은 분석 상한의 2배까지
    const candidates = await discover(octokit, limit * 2);
    discovered = candidates.length;
    console.log(`발굴: ${discovered}건`);

    const existing = await loadExisting(db);
    const taken = new Set([...existing.values()].map((e) => e.slug));

    const items: Item[] = [];
    for (const candidate of candidates) {
      const meta = parseSkillMd(candidate.raw);
      if (!meta) continue; // frontmatter 불량 → 무효 스킬, 무시
      items.push({
        candidate,
        meta,
        hash: contentHash(candidate.raw),
        ex: existing.get(skillKey(candidate.repoFullName, candidate.path)),
      });
    }

    const toAnalyze = items.filter((it) => needsAnalysis(it.ex, it.hash)).slice(0, limit);
    console.log(`분석 대상: ${toAnalyze.length}건 (상한 ${limit})`);

    const requests = toAnalyze.map((it, i) => buildBatchRequest(it.candidate, `c${i}`));
    const outcomes = await runAnalysisBatch(anthropic, requests);
    for (const o of outcomes.values()) cost += costUsd(o.inputTokens, o.outputTokens);

    const publishedRepos = new Set<string>();
    for (const it of items) {
      const idx = toAnalyze.indexOf(it);
      // 상한 초과 이월(신규·변경·재시도 모두): 이번 런에서 건드리지 않아야
      // 기존 해시가 보존되어 다음 런의 needsAnalysis가 다시 감지한다
      if (idx === -1 && needsAnalysis(it.ex, it.hash)) continue;

      let status: string, attempts: number, aiScoreForRank: number | null;
      let analysis: Analysis | null = null;
      if (idx > -1) {
        analyzed++;
        const outcome = outcomes.get(`c${idx}`);
        analysis = outcome?.analysis ?? null;
        if (!analysis) {
          errors++;
          console.warn(`분석 실패 ${it.candidate.repoFullName}/${it.candidate.path}: ${outcome?.error ?? "결과 없음"}`);
        }
        const ns = nextStatus(analysis !== null, analysis?.ai_score ?? null, it.candidate.isOfficial, it.ex?.analysis_attempts ?? 0);
        status = ns.status;
        attempts = ns.attempts;
        aiScoreForRank = analysis?.ai_score ?? it.ex?.ai_score ?? null;
      } else {
        // 변경 없음 — 지표·랭킹만 갱신, 상태 유지
        status = it.ex!.status;
        attempts = it.ex!.analysis_attempts;
        aiScoreForRank = it.ex!.ai_score;
      }

      const slug = it.ex?.slug ?? makeSlug(it.meta.name, it.candidate.repoFullName, taken);
      taken.add(slug);
      try {
        const skillId = await upsertSkill(db, {
          candidate: it.candidate, hash: it.hash, slug, status, attempts, analysis, aiScoreForRank,
        });
        if (analysis) await upsertTranslations(db, skillId, analysis);
        await snapshotMetrics(db, skillId, it.candidate.stars);
        published++;
        publishedRepos.add(it.candidate.repoFullName);
      } catch (e) {
        errors++;
        console.error((e as Error).message);
      }
    }

    // 발굴 미포함 추적 스킬 지표 갱신 + 삭제 감지 + 트렌딩 재계산
    // 이번 런에 실제 발행(지표 갱신)된 repo만 제외 — 이월된 후보의 repo는 refresh가 커버
    const refresh = await refreshUndiscovered(db, octokit, publishedRepos);
    const trended = await updateTrending(db);
    notes = `refresh ${refresh.refreshed}, hidden ${refresh.hidden}, trending ${trended}`;
    console.log(`지표 갱신 ${refresh.refreshed}건, 숨김 ${refresh.hidden}건, 트렌딩 ${trended}건`);

    // 주간 컬렉션 (KST 일요일 03시 런 = UTC 토 18시) 또는 --collections 강제
    const isWeekly = new Date().getUTCDay() === 6 || process.argv.includes("--collections");
    if (isWeekly) {
      const { data: visRows, error: visErr } = await db
        .from("skills")
        .select("slug, category, skill_translations!inner(locale, name, one_liner)")
        .eq("status", "visible")
        .eq("skill_translations.locale", "en")
        .order("rank_score", { ascending: false })
        .limit(300);
      if (visErr) throw new Error(`컬렉션 입력 조회 실패: ${visErr.message}`);
      const inputs: CollectionInput[] = (visRows as unknown as {
        slug: string;
        category: string;
        skill_translations: { name: string; one_liner: string }[];
      }[]).map((r) => ({
        slug: r.slug,
        category: r.category,
        name: r.skill_translations[0]?.name ?? r.slug,
        one_liner: r.skill_translations[0]?.one_liner ?? "",
      }));
      const generated = await generateCollections(anthropic, inputs);
      const sets = await publishCollections(db, generated);
      notes = `${notes ? notes + "; " : ""}collections ${sets}`;
      console.log(`컬렉션 ${sets}세트 발행`);
    }
  } catch (e) {
    notes = (e as Error).message;
    throw e;
  } finally {
    await db.from("pipeline_runs").update({
      finished_at: new Date().toISOString(),
      discovered, analyzed, published, errors,
      cost_usd: Number(cost.toFixed(4)),
      notes: notes || null,
    }).eq("id", runId);
    console.log(`완료 — 발굴 ${discovered}, 분석 ${analyzed}, 발행 ${published}, 오류 ${errors}, 비용 $${cost.toFixed(2)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
