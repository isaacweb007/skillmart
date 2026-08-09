# 클로드스킬마트 M3 — 가동 (백필·cron·트렌딩·컬렉션) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 파이프라인을 상시 가동 체제로 올린다 — 발굴 페이지네이션(런당 후보 500), 전체 지표 갱신·삭제 감지·트렌딩 계산, 주간 컬렉션 자동 생성, GitHub Private 저장소+cron 가동, 백필 +300건 — 그리고 웹에 트렌딩·컬렉션을 노출하고 이월 수정을 묶어 처리한다.

**Architecture:** 파이프라인에 2개 스테이지 추가: ①발굴 미포함 추적 스킬의 지표 갱신 패스(repos.get — 404면 hidden 처리=삭제 감지) ②트렌딩 계산(7일 스타 증가 → `skills.trending_delta`). 컬렉션은 KST 일요일 런(UTC 토 18시)에 Claude 1콜(구조화 출력)로 6~10세트 생성, `is_pinned` 보호. 웹은 데이터 계층에 트렌딩·컬렉션 쿼리를 추가하고 홈·목록·컬렉션 페이지에 노출. 마이그레이션 0002가 `trending_delta` 컬럼과 RLS visible 필터를 추가한다.

**Tech Stack:** M1·M2와 동일. 신규 의존성 없음.

**사용자 확정 사항:** GitHub 저장소 `skillmart` **Private** 생성·push·시크릿 등록·cron 가동 / 백필 **+300건**(≈$22) 단계적.

## Global Constraints

- 런당 검색 신규 후보 캡: `MAX_SEARCH_REPOS = 300`(저장소), 토픽당 최대 6페이지(50×6), 코드 검색 최대 4페이지 — 발굴 후보 상한은 기존 `maxCandidates` 유지 (스펙 6.1의 "500/런 이월" 이행)
- 지표 갱신·삭제 감지 대상: `status='visible'`만. repo 조회 404/451 → 해당 repo의 스킬 전부 `hidden` (데이터 보존, 스펙 6.4)
- 트렌딩: `trending_delta = 오늘 stars − (오늘−7일 이전의 가장 최근 스냅샷 stars)`, 스냅샷 없으면 0. 웹 노출은 `trending_delta > 0`만
- 컬렉션: KST 일요일 런(`new Date().getUTCDay() === 6` — cron이 UTC 18시라 KST 일요일 03시 실행분) 또는 `--collections` 플래그. 세트 6~10개, 세트당 스킬 3~8개(3개 미만 세트는 폐기), `is_pinned=true`는 건드리지 않음. 언어는 ko/vi/en 3종
- 컬렉션 생성 모델: `claude-opus-5` 단건 호출(배치 아님), 구조화 출력
- RLS 강화(0002): skills·skill_translations의 공개 select를 visible 조건으로 교체 (파이프라인은 service_role이라 무영향)
- 웹: 트렌딩·컬렉션 섹션은 데이터 있을 때만 렌더 (빈 상태에서 홈이 깨지면 안 됨)
- GitHub: Private 저장소 `skillmart`, 시크릿 3종(ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)은 `.env`에서 읽어 `gh secret set`으로 등록 — **값을 로그·리포트에 출력 금지**
- dev 서버 가동 중 `next build` 금지 (기존 교훈)
- 커밋은 태스크마다 1회 이상. M4로 이월: metadataBase+절대 hreflang+x-default, sitemap, 도메인

---

### Task 1: 발굴 페이지네이션 (런당 후보 500 체제)

**Files:**
- Modify: `pipeline/src/github/discover.ts`

**Interfaces:**
- Consumes: 기존 discover 구조
- Produces: 시그니처 불변(`discover(octokit, maxCandidates)`). 내부만 확장: 토픽 검색 페이지 1~6, 코드 검색 페이지 1~4, `MAX_SEARCH_REPOS = 300`
- 네트워크 로직이라 신규 단위 테스트 없음(기존 `isSkillMdPath` 테스트 유지) — Task 7 백필 실행이 검증

- [ ] **Step 1: 상수 교체**

`MAX_SEARCH_REPOS`를 100 → 300으로 바꾸고 아래 상수를 추가:
```ts
const MAX_SEARCH_REPOS = 300; // 런당 검색으로 새로 스캔할 저장소 상한 (초과분은 다음 런 이월)
const TOPIC_PAGES = 6; // 토픽당 50 × 6 = 최대 300
const CODE_PAGES = 4;
```

- [ ] **Step 2: 토픽 검색 페이지네이션**

기존 토픽 루프 블록(2단계 주석 포함)을 아래로 교체:
```ts
  // 2) 토픽 검색 (분당 30회 제한 → 호출 간 대기, 페이지네이션)
  for (const topic of TOPICS) {
    for (let page = 1; page <= TOPIC_PAGES; page++) {
      if (repos.size >= SEED_REPOS.length + MAX_SEARCH_REPOS) break;
      let pageCount = 0;
      try {
        const { data } = await octokit.search.repos({
          q: `topic:${topic}`,
          sort: "stars",
          per_page: 50,
          page,
        });
        pageCount = data.items.length;
        for (const r of data.items) {
          if (repos.size >= SEED_REPOS.length + MAX_SEARCH_REPOS) break;
          if (!repos.has(r.full_name)) {
            repos.set(r.full_name, {
              full_name: r.full_name,
              default_branch: r.default_branch ?? "main",
              stargazers_count: r.stargazers_count ?? 0,
              forks_count: r.forks_count ?? 0,
              pushed_at: r.pushed_at ?? null,
              license: r.license ?? null,
            });
          }
        }
      } catch (e) {
        console.warn(`topic:${topic} p${page} 검색 실패: ${(e as Error).message}`);
        break;
      }
      await sleep(2500);
      if (pageCount < 50) break; // 마지막 페이지
    }
  }
```

- [ ] **Step 3: 코드 검색 페이지네이션**

기존 코드 검색 try 블록 내부의 단일 호출을 페이지 루프로 교체 (베스트 에포트 성격 유지 — 바깥 try/catch 그대로):
```ts
    for (let page = 1; page <= CODE_PAGES; page++) {
      if (repos.size >= SEED_REPOS.length + MAX_SEARCH_REPOS) break;
      const { data } = await octokit.search.code({ q: "filename:SKILL.md", per_page: 50, page });
      for (const item of data.items) {
        if (repos.size >= SEED_REPOS.length + MAX_SEARCH_REPOS) break;
        const fullName = item.repository.full_name;
        if (repos.has(fullName)) continue;
        const [owner, repo] = fullName.split("/");
        try {
          const { data: full } = await octokit.repos.get({ owner, repo });
          repos.set(full.full_name, full as RepoInfo);
        } catch {
          // 접근 불가 저장소는 무시
        }
        await sleep(1000);
      }
      await sleep(2500);
      if (data.items.length < 50) break;
    }
```

- [ ] **Step 4: 게이트 + 커밋**

Run: `npm run --workspace pipeline test && npm run --workspace pipeline typecheck`
Expected: 기존 38개 통과

```bash
git add pipeline/ && git commit -m "feat: 발굴 페이지네이션 — 토픽 6p·코드검색 4p, 검색 저장소 상한 300"
```

---

### Task 2: 마이그레이션 0002 + 지표 갱신·삭제 감지·트렌딩 패스

**Files:**
- Create: `supabase/migrations/0002_trending_rls.sql`
- Create: `pipeline/src/refresh.ts`, `pipeline/src/lib/trend.ts`
- Modify: `pipeline/src/run.ts` (패스 연결)
- Test: `pipeline/test/trend.test.ts`

**Interfaces:**
- Consumes: `rankScore`(lib/score), skills·skill_metrics_daily 테이블, run.ts의 `discovered` 후보 집합
- Produces:
  - `trendingDelta(snapshots: { date: string; stars: number }[], todayStars: number, today: string): number` (순수, TDD)
  - `refreshUndiscovered(db, octokit, discoveredRepos: Set<string>): Promise<{ refreshed: number; hidden: number }>`
  - `updateTrending(db): Promise<number>` — visible 전체의 trending_delta 갱신, 갱신 건수 반환
  - run.ts 흐름 끝에: `refreshUndiscovered` → `updateTrending` 순서로 호출, 결과를 콘솔+pipeline_runs.notes에 요약

- [ ] **Step 1: 마이그레이션 작성·적용**

`supabase/migrations/0002_trending_rls.sql`:
```sql
alter table skills add column trending_delta int not null default 0;

-- RLS 강화: 공개 읽기를 visible로 제한 (파이프라인은 service_role이라 무영향)
drop policy "public read" on skills;
create policy "public read visible" on skills for select using (status = 'visible');

drop policy "public read" on skill_translations;
create policy "public read visible" on skill_translations for select
  using (exists (select 1 from skills s where s.id = skill_id and s.status = 'visible'));
```
Supabase MCP `apply_migration`(project_id `cbyuzwxamjdzxhltcjcl`, name `trending_rls`)으로 적용, `list_tables`(verbose)로 skills에 trending_delta 확인.

- [ ] **Step 2: 트렌딩 순수 함수 TDD**

`pipeline/test/trend.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { trendingDelta } from "../src/lib/trend.js";

const TODAY = "2026-08-09";

describe("trendingDelta", () => {
  it("7일 이전의 가장 최근 스냅샷과의 차이를 돌려준다", () => {
    const snaps = [
      { date: "2026-08-01", stars: 100 }, // 8일 전 — 기준
      { date: "2026-08-05", stars: 120 }, // 7일 이내 — 무시
    ];
    expect(trendingDelta(snaps, 150, TODAY)).toBe(50);
  });
  it("정확히 7일 전 스냅샷도 기준이 된다", () => {
    expect(trendingDelta([{ date: "2026-08-02", stars: 90 }], 100, TODAY)).toBe(10);
  });
  it("7일 이전 스냅샷이 없으면 0", () => {
    expect(trendingDelta([{ date: "2026-08-08", stars: 10 }], 50, TODAY)).toBe(0);
    expect(trendingDelta([], 50, TODAY)).toBe(0);
  });
  it("감소하면 음수를 그대로 돌려준다 (노출 필터는 웹에서)", () => {
    expect(trendingDelta([{ date: "2026-08-01", stars: 100 }], 80, TODAY)).toBe(-20);
  });
});
```

Run: `npm run --workspace pipeline test` → trend 테스트 FAIL(모듈 없음) 확인.

`pipeline/src/lib/trend.ts`:
```ts
export function trendingDelta(
  snapshots: { date: string; stars: number }[],
  todayStars: number,
  today: string,
): number {
  const cutoff = new Date(new Date(`${today}T00:00:00Z`).getTime() - 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const base = snapshots
    .filter((s) => s.date <= cutoff)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return base ? todayStars - base.stars : 0;
}
```

Run: 테스트 PASS 확인.

- [ ] **Step 3: 갱신 패스 구현**

`pipeline/src/refresh.ts`:
```ts
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
```

- [ ] **Step 4: run.ts 연결**

run.ts에 임포트 추가:
```ts
import { refreshUndiscovered, updateTrending } from "./refresh.js";
```
발행 루프가 끝난 뒤(try 블록 안, finally 앞)에 추가:
```ts
    // 발굴 미포함 추적 스킬 지표 갱신 + 삭제 감지 + 트렌딩 재계산
    const discoveredRepos = new Set(candidates.map((c) => c.repoFullName));
    const refresh = await refreshUndiscovered(db, octokit, discoveredRepos);
    const trended = await updateTrending(db);
    notes = `refresh ${refresh.refreshed}, hidden ${refresh.hidden}, trending ${trended}`;
    console.log(`지표 갱신 ${refresh.refreshed}건, 숨김 ${refresh.hidden}건, 트렌딩 ${trended}건`);
```
(참고: `notes`는 기존에 오류 시에만 쓰였음 — finally의 update가 `notes: notes || null`이므로 성공 요약이 함께 기록된다. 오류 발생 시 catch에서 `notes = (e as Error).message`가 덮어써도 무방.)

- [ ] **Step 5: 게이트 + 커밋**

Run: `npm run --workspace pipeline test && npm run --workspace pipeline typecheck`
Expected: 42개(38+4) 통과

```bash
git add pipeline/ supabase/ && git commit -m "feat: 지표 갱신·삭제 감지·트렌딩 패스 + RLS visible 강화 (0002)"
```

---

### Task 3: 주간 컬렉션 자동 생성

**Files:**
- Create: `pipeline/src/claude/collections.ts`
- Modify: `pipeline/src/run.ts`
- Test: `pipeline/test/collections.test.ts`

**Interfaces:**
- Consumes: `MODEL`(analyze.ts), skills·collections 테이블
- Produces:
  - `COLLECTIONS_SCHEMA`(구조화 출력), `buildCollectionsPrompt(skills: CollectionInput[]): string`
  - `interface CollectionInput { slug: string; name: string; category: string; one_liner: string }`
  - `interface GeneratedCollection { slug: string; skill_slugs: string[]; translations: Record<"ko"|"vi"|"en", { title: string; description: string }> }`
  - `generateCollections(client, skills): Promise<GeneratedCollection[]>` — 검증(존재 slug 필터, 3개 미만 폐기) 포함
  - `publishCollections(db, generated): Promise<number>` — is_pinned=false 삭제 후 삽입, 삽입 세트 수 반환
  - run.ts: KST 일요일 런(`getUTCDay() === 6`) 또는 `--collections` 플래그일 때 실행

- [ ] **Step 1: 실패하는 테스트 작성**

`pipeline/test/collections.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  buildCollectionsPrompt,
  COLLECTIONS_SCHEMA,
  validateCollections,
} from "../src/claude/collections.js";

const SKILLS = [
  { slug: "pptx", name: "PPTX", category: "docs-office", one_liner: "Make decks" },
  { slug: "docx", name: "DOCX", category: "docs-office", one_liner: "Write docs" },
  { slug: "pdf", name: "PDF", category: "docs-office", one_liner: "Read PDFs" },
];

describe("COLLECTIONS_SCHEMA", () => {
  it("구조화 출력 규칙을 지킨다", () => {
    expect(COLLECTIONS_SCHEMA.additionalProperties).toBe(false);
    const item = COLLECTIONS_SCHEMA.properties.collections.items;
    expect(item.required).toEqual(["slug", "skill_slugs", "translations"]);
    expect(item.properties.translations.required).toEqual(["ko", "vi", "en"]);
  });
});

describe("buildCollectionsPrompt", () => {
  it("스킬 카탈로그를 담는다", () => {
    const p = buildCollectionsPrompt(SKILLS);
    expect(p).toContain("pptx");
    expect(p).toContain("Make decks");
  });
});

describe("validateCollections", () => {
  const t = { ko: { title: "ㄱ", description: "ㄴ" }, vi: { title: "a", description: "b" }, en: { title: "c", description: "d" } };
  it("존재하지 않는 slug를 걸러내고, 3개 미만이 되면 세트를 폐기한다", () => {
    const out = validateCollections(
      [
        { slug: "office", skill_slugs: ["pptx", "docx", "pdf", "ghost"], translations: t },
        { slug: "tiny", skill_slugs: ["pptx", "ghost1", "ghost2"], translations: t },
      ],
      new Set(["pptx", "docx", "pdf"]),
    );
    expect(out).toHaveLength(1);
    expect(out[0].skill_slugs).toEqual(["pptx", "docx", "pdf"]);
  });
});
```

Run: `npm run --workspace pipeline test` → FAIL(모듈 없음) 확인.

- [ ] **Step 2: 구현**

`pipeline/src/claude/collections.ts`:
```ts
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
): Promise<GeneratedCollection[]> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { format: { type: "json_schema" as const, schema: COLLECTIONS_SCHEMA } },
    messages: [{ role: "user" as const, content: buildCollectionsPrompt(skills) }],
  });
  if (response.stop_reason === "refusal") return [];
  let text = "";
  for (const block of response.content) {
    if (block.type === "text") {
      text = block.text;
      break;
    }
  }
  try {
    const parsed = JSON.parse(text) as { collections: GeneratedCollection[] };
    return validateCollections(parsed.collections, new Set(skills.map((s) => s.slug)));
  } catch {
    console.error("컬렉션 JSON 파싱 실패");
    return [];
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

  const { error: delErr } = await db.from("collections").delete().eq("is_pinned", false);
  if (delErr) throw new Error(`기존 컬렉션 삭제 실패: ${delErr.message}`);

  let inserted = 0;
  for (const c of generated) {
    const skillIds = c.skill_slugs.map((s) => idBySlug.get(s)).filter((x): x is string => !!x);
    if (skillIds.length < 3) continue;
    const { data: row, error: insErr } = await db
      .from("collections")
      .insert({ slug: c.slug, skill_ids: skillIds })
      .select("id")
      .single();
    if (insErr) {
      console.error(`컬렉션 삽입 실패 ${c.slug}: ${insErr.message}`);
      continue;
    }
    const collectionId = (row as { id: string }).id;
    const trRows = (["ko", "vi", "en"] as const).map((locale) => ({
      collection_id: collectionId,
      locale,
      title: c.translations[locale].title,
      description: c.translations[locale].description,
    }));
    const { error: trErr } = await db.from("collection_translations").insert(trRows);
    if (trErr) {
      console.error(`컬렉션 번역 삽입 실패 ${c.slug}: ${trErr.message}`);
      continue;
    }
    inserted++;
  }
  return inserted;
}
```

- [ ] **Step 3: run.ts 연결**

임포트 추가:
```ts
import { generateCollections, publishCollections, type CollectionInput } from "./claude/collections.js";
```
Task 2에서 넣은 트렌딩 블록 바로 뒤에 추가:
```ts
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
```

- [ ] **Step 4: 게이트 + 커밋**

Run: `npm run --workspace pipeline test && npm run --workspace pipeline typecheck`
Expected: 46개(42+4) 통과

```bash
git add pipeline/ && git commit -m "feat: 주간 컬렉션 자동 생성 (일요일 런·--collections, 구조화 출력)"
```

---

### Task 4: 웹 — 트렌딩·컬렉션 노출

**Files:**
- Modify: `apps/web/lib/db.ts`, `apps/web/app/[locale]/page.tsx`, `apps/web/app/[locale]/skills/page.tsx`, `apps/web/messages/{ko,vi,en}.json`
- Create: `apps/web/app/[locale]/collections/[slug]/page.tsx`

**Interfaces:**
- Consumes: 0002 마이그레이션(trending_delta), collections 데이터
- Produces:
  - db.ts: `SkillListItem`에 `trending_delta: number` 추가(LIST_COLS에도), `searchSkills` sort에 `"trending"`, `getTrendingSkills(locale, limit): Promise<SkillListItem[]>`, `interface CollectionSummary { id, slug, title, description, count }`, `getCollections(locale): Promise<CollectionSummary[]>`, `getCollectionBySlug = cache((slug, locale) => Promise<{ summary: CollectionSummary; skills: SkillListItem[] } | null>)`
  - 홈: 트렌딩 섹션(데이터 있을 때만), 컬렉션 카드 섹션(있을 때만)
  - 목록: 정렬 칩에 트렌딩 추가
  - `/[locale]/collections/[slug]` 페이지

- [ ] **Step 1: 메시지 키 추가 (3개 파일 모두, 기존 구조 유지하며 삽입)**

ko.json — `home`에 `"trending": "지금 뜨는 스킬"`, `"collections": "추천 세트"` 추가, `list`에 `"sortTrending": "트렌딩"` 추가, 최상위에:
```json
  "collection": {
    "skillCount": "{count}개 스킬",
    "back": "홈으로"
  },
```
vi.json — `"trending": "Đang nổi"`, `"collections": "Bộ sưu tập gợi ý"`, `"sortTrending": "Nổi bật"`,
```json
  "collection": {
    "skillCount": "{count} skill",
    "back": "Về trang chủ"
  },
```
en.json — `"trending": "Trending now"`, `"collections": "Curated sets"`, `"sortTrending": "Trending"`,
```json
  "collection": {
    "skillCount": "{count} skills",
    "back": "Back home"
  },
```

- [ ] **Step 2: db.ts 확장**

`LIST_COLS`에 `trending_delta` 추가:
```ts
const LIST_COLS =
  "id, slug, category, difficulty, ai_score, stars, is_official, created_at, rank_score, trending_delta";
```
`SkillListItem`에 `trending_delta: number;` 필드 추가.

`searchSkills`의 opts.sort 타입을 `"rank" | "new" | "trending"`으로, 정렬 분기를:
```ts
  if (opts.sort === "new") query = query.order("created_at", { ascending: false });
  else if (opts.sort === "trending")
    query = query.order("trending_delta", { ascending: false }).order("rank_score", { ascending: false });
  else query = query.order("rank_score", { ascending: false });
```

파일 끝에 추가:
```ts
export async function getTrendingSkills(locale: string, limit = 8): Promise<SkillListItem[]> {
  const { data, error } = await db
    .from("skills")
    .select(`${LIST_COLS}, skill_translations(locale, name, one_liner)`)
    .eq("status", "visible")
    .gt("trending_delta", 0)
    .order("trending_delta", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`trending 조회 실패: ${error.message}`);
  return (data as Record<string, unknown>[])
    .map((r) => toListItem(r, locale))
    .filter((x): x is SkillListItem => x !== null);
}

export interface CollectionSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  count: number;
}

interface CollectionRow {
  id: string;
  slug: string;
  skill_ids: string[];
  collection_translations: { locale: string; title: string; description: string }[];
}

function toCollectionSummary(row: CollectionRow, locale: string): CollectionSummary | null {
  const tr =
    row.collection_translations.find((t) => t.locale === locale) ??
    row.collection_translations.find((t) => t.locale === "en") ??
    row.collection_translations[0];
  if (!tr) return null;
  return { id: row.id, slug: row.slug, title: tr.title, description: tr.description, count: row.skill_ids.length };
}

export async function getCollections(locale: string): Promise<CollectionSummary[]> {
  const { data, error } = await db
    .from("collections")
    .select("id, slug, skill_ids, collection_translations(locale, title, description)");
  if (error) throw new Error(`collections 조회 실패: ${error.message}`);
  return (data as CollectionRow[])
    .map((r) => toCollectionSummary(r, locale))
    .filter((x): x is CollectionSummary => x !== null);
}

export const getCollectionBySlug = cache(
  async (
    slug: string,
    locale: string,
  ): Promise<{ summary: CollectionSummary; skills: SkillListItem[] } | null> => {
    const { data, error } = await db
      .from("collections")
      .select("id, slug, skill_ids, collection_translations(locale, title, description)")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(`collection 상세 조회 실패: ${error.message}`);
    if (!data) return null;
    const summary = toCollectionSummary(data as CollectionRow, locale);
    if (!summary) return null;
    const { data: skillRows, error: skillErr } = await db
      .from("skills")
      .select(`${LIST_COLS}, skill_translations(locale, name, one_liner)`)
      .eq("status", "visible")
      .in("id", (data as CollectionRow).skill_ids)
      .order("rank_score", { ascending: false });
    if (skillErr) throw new Error(`collection 스킬 조회 실패: ${skillErr.message}`);
    const skills = (skillRows as Record<string, unknown>[])
      .map((r) => toListItem(r, locale))
      .filter((x): x is SkillListItem => x !== null);
    return { summary, skills };
  },
);
```

- [ ] **Step 3: 홈에 섹션 추가**

`page.tsx`에서 임포트에 `getCollections, getTrendingSkills` 추가, Promise.all을:
```ts
  const [count, { top, fresh }, trending, collections] = await Promise.all([
    getVisibleCount(),
    getHomeSkills(locale),
    getTrendingSkills(locale),
    getCollections(locale),
  ]);
```
코너 섹션 아래·인기 위에 삽입:
```tsx
      {collections.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 font-display text-xl font-bold">{t("home.collections")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="group block rounded-xl border border-line bg-surface p-4 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <h3 className="mb-1 font-display text-lg font-bold group-hover:text-accent">{c.title}</h3>
                <p className="mb-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{c.description}</p>
                <span className="text-xs text-accent">{t("collection.skillCount", { count: c.count })} →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <HomeSection
          title={t("home.trending")}
          viewAll={t("home.viewAll")}
          href="/skills?sort=trending"
          skills={trending}
        />
      )}
```

- [ ] **Step 4: 목록 정렬 칩 + sort 파싱**

`skills/page.tsx`: sort 파싱을
```ts
  const sort = sp.sort === "new" ? "new" : sp.sort === "trending" ? "trending" : "rank";
```
정렬 칩 행의 sortNew 칩 뒤에:
```tsx
        <Link href={qs(base, { sort: "trending" })}>
          <Chip active={sort === "trending"}>{t("list.sortTrending")}</Chip>
        </Link>
```

- [ ] **Step 5: 컬렉션 상세 페이지**

`apps/web/app/[locale]/collections/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SkillCard from "@/components/SkillCard";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getCollectionBySlug } from "@/lib/db";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getCollectionBySlug(slug, locale);
  if (!data) return {};
  return {
    title: data.summary.title,
    description: data.summary.description,
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/collections/${slug}`])),
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const data = await getCollectionBySlug(slug, locale);
  if (!data) notFound();

  return (
    <div className="py-8">
      <Link href="/" className="text-sm text-ink-soft hover:text-ink">
        ← {t("collection.back")}
      </Link>
      <h1 className="mt-4 mb-2 font-display text-3xl font-bold">{data.summary.title}</h1>
      <p className="mb-6 max-w-2xl leading-relaxed text-ink-soft">{data.summary.description}</p>
      <p className="mb-4 text-sm text-ink-soft">
        {t("collection.skillCount", { count: data.skills.length })}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.skills.map((s) => (
          <SkillCard key={s.id} skill={s} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 게이트 + 커밋**

Run: `npm run --workspace web typecheck && npm run --workspace web build`
Expected: 통과 (dev 서버 꺼진 상태에서)

```bash
git add apps/web && git commit -m "feat(web): 트렌딩·컬렉션 노출 (홈 섹션, 정렬, 컬렉션 페이지)"
```

---

### Task 5: 웹 이월 수정 묶음

**Files:**
- Create: `apps/web/app/[locale]/[...rest]/page.tsx`, `apps/web/app/[locale]/error.tsx`
- Modify: `apps/web/components/LocaleSwitcher.tsx`, `apps/web/components/Header.tsx`, `apps/web/components/CopyButton.tsx`, `apps/web/app/[locale]/skills/page.tsx`, `apps/web/app/[locale]/skills/[slug]/page.tsx`, `apps/web/messages/{ko,vi,en}.json`

**Interfaces:**
- Consumes: 기존 컴포넌트·메시지
- Produces: catch-all 404, 브랜드 error 경계, 쿼리 보존 언어 전환, a11y(aria-current/aria-hidden/aria-live/clipboard 방어), 상세에 forks 표시

- [ ] **Step 1: 메시지 키 (3개 파일)**

최상위에 추가 — ko: `"error": { "title": "잠깐 문제가 생겼어요", "desc": "새로고침하거나 잠시 뒤 다시 시도해주세요.", "retry": "다시 시도" }`, vi: `{ "title": "Đã có lỗi xảy ra", "desc": "Hãy tải lại trang hoặc thử lại sau ít phút.", "retry": "Thử lại" }`, en: `{ "title": "Something went wrong", "desc": "Refresh the page or try again in a moment.", "retry": "Try again" }`

- [ ] **Step 2: catch-all 404 + error 경계**

`apps/web/app/[locale]/[...rest]/page.tsx`:
```tsx
import { notFound } from "next/navigation";

export default function CatchAll() {
  notFound();
}
```

`apps/web/app/[locale]/error.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("error");
  return (
    <div className="py-24 text-center">
      <h1 className="mb-2 font-display text-2xl font-bold">{t("title")}</h1>
      <p className="mb-6 text-sm text-ink-soft">{t("desc")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink"
      >
        {t("retry")}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: LocaleSwitcher 쿼리 보존 (+Suspense)**

`LocaleSwitcher.tsx` 전체 교체:
```tsx
"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { ko: "한국어", vi: "Tiếng Việt", en: "English" };

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = Object.fromEntries(searchParams.entries());
  return (
    <nav className="flex gap-1 text-xs">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={{ pathname, query }}
          locale={l}
          aria-current={l === locale ? "true" : undefined}
          className={`whitespace-nowrap rounded-full px-2 py-1 ${
            l === locale ? "bg-accent text-accent-ink" : "text-ink-soft hover:text-ink"
          }`}
        >
          {LABELS[l]}
        </Link>
      ))}
    </nav>
  );
}
```
`Header.tsx`: `import { Suspense } from "react";` 추가, `<LocaleSwitcher />`를
```tsx
          <Suspense fallback={null}>
            <LocaleSwitcher />
          </Suspense>
```
로 감싼다 (useSearchParams는 Suspense 경계 필요).

참고: next-intl `Link`의 href 객체형(`{pathname, query}`)이 설치 버전에서 타입 거부되면, 최소 수정으로 `href={\`${pathname}?${searchParams.toString()}\`}`(쿼리 없으면 pathname만) 형태로 대체하고 리포트에 기록.

- [ ] **Step 4: 목록 a11y + 상세 forks**

`skills/page.tsx`: 모든 필터·정렬 `<Link>`(칩 감싸는 것들)에 `aria-current={활성조건 ? "true" : undefined}`를 각각 추가 (카테고리 전체/12개, 난이도 전체/3개, 정렬 3개 — 활성 조건은 해당 Chip의 active와 동일). 구분자 `<span className="mx-2 text-line">|</span>`에 `aria-hidden="true"` 추가.

`skills/[slug]/page.tsx`: 메타 행의 stars span 뒤에:
```tsx
          <span>⑂ {skill.forks.toLocaleString()}</span>
```

- [ ] **Step 5: CopyButton 방어 + aria-live**

`CopyButton.tsx`의 button을:
```tsx
    <button
      type="button"
      aria-live="polite"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // 클립보드 권한 거부 등 — 조용히 무시 (수동 복사 가능)
        }
      }}
```
(나머지 동일)

- [ ] **Step 6: 게이트 + 커밋**

Run: `npm run --workspace web typecheck && npm run --workspace web build`
Expected: 통과

```bash
git add apps/web && git commit -m "fix(web): 이월 수정 묶음 — catch-all 404, error 경계, 언어전환 쿼리 보존, a11y, forks"
```

---

### Task 6: GitHub Private 저장소 + 시크릿 + cron 가동 (컨트롤러 수행)

**Files:**
- 없음 (원격 인프라)

**Interfaces:**
- Consumes: 로컬 master(머지 완료 상태), `.env`, `gh` CLI 인증
- Produces: `github.com/<owner>/skillmart`(private) + secrets 3종 + cron 활성 + 첫 workflow_dispatch 실행 성공

- [ ] **Step 1: 저장소 생성·push** (사용자 승인 완료: Private)

```bash
cd "/Users/isaac/Downloads/클로드스킬마트"
gh repo create skillmart --private --source . --push
```
Expected: master가 push되고 저장소 URL 출력

- [ ] **Step 2: 시크릿 등록 (값 출력 금지)**

```bash
set -a && source .env && set +a
gh secret set ANTHROPIC_API_KEY --body "$ANTHROPIC_API_KEY"
gh secret set SUPABASE_URL --body "$SUPABASE_URL"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "$SUPABASE_SERVICE_ROLE_KEY"
gh secret list
```
Expected: 3종 표시

- [ ] **Step 3: 수동 실행으로 가동 검증**

```bash
gh workflow run daily-pipeline -f limit=100
sleep 20 && gh run list --workflow daily-pipeline --limit 1
gh run watch $(gh run list --workflow daily-pipeline --limit 1 --json databaseId -q '.[0].databaseId') --exit-status
```
Expected: 성공. 실패 시 `gh run view --log-failed`로 원인 확인 — 특히 코드 검색이 기본 GITHUB_TOKEN 권한으로 거부되는지 로그 확인(best-effort라 실패해도 런은 성공해야 정상). 코드 검색 거부 확인 시 원장에 기록만 (시드+토픽으로 충분).

- [ ] **Step 4: 원장 기록**

cron은 push 순간부터 활성(매일 UTC 18시). 확인 사항을 원장에 기록.

---

### Task 7: 백필 +300 실행 + 스팟 검수 (컨트롤러 수행)

- [ ] **Step 1: 로컬 백필 실행** (T1 페이지네이션 반영 후이므로 발굴 폭 확대됨)

```bash
cd "/Users/isaac/Downloads/클로드스킬마트"
set -a && source .env && set +a && export GITHUB_TOKEN=$(gh auth token)
npm run --workspace pipeline start -- --limit 300 > .superpowers/sdd/m3-backfill.log 2>&1
tail -3 .superpowers/sdd/m3-backfill.log
```
Expected: 발굴 500~700, 분석 ≤300, 비용 ≈$22 내외 — pipeline_runs에서 실측 확인

- [ ] **Step 2: 컬렉션 강제 생성 1회**

```bash
npm run --workspace pipeline start -- --limit 0 --collections
```
(limit 0은 유효성 검사에 걸리므로 `--limit 1 --collections`로 실행) Expected: `컬렉션 6~10세트 발행`

- [ ] **Step 3: DB 검증 + 스팟 검수**

- 검증 쿼리: 신규 스킬 수, status 분포, trending_delta 분포(0 아닌 것 존재 여부 — 첫날은 스냅샷 7일치가 없어 0이 정상), 컬렉션 세트·번역 수
- QA 에이전트(sonnet): 신규 비공식 스킬 10건 표본 — 카테고리·한국어 해설·install_command 검수 + 컬렉션 3세트 제목·설명 3개 언어 자연스러움

- [ ] **Step 4: 원장 기록** (비용 실측, 검수 판정)

---

### Task 8: E2E 스모크(신규 화면) + 최종 전체 브랜치 리뷰

- [ ] **Step 1: 웹 스모크** (프리뷰 서버, 컨트롤러 수행)

1. 홈: 컬렉션 섹션·트렌딩 섹션(트렌딩은 첫 주 비어있을 수 있음 — 없으면 미렌더 확인) 
2. 컬렉션 상세: 3개 언어 제목·스킬 카드
3. `/ko/skills?sort=trending` 정렬 칩 동작
4. `/ko/aaa/bbb` catch-all 404 (브랜드 화면)
5. 언어 전환 시 쿼리 보존 (`/ko/skills?q=ppt` → vi 전환 → q 유지)
6. 상세 forks 표시
7. 콘솔 에러 0, 스크린샷 전송

- [ ] **Step 2: 최종 전체 브랜치 리뷰** (fable, 원장 Minor 트리아지 포함) → 수정 → 머지 (finishing-a-development-branch)

---

## Self-Review 결과

- 스펙 커버리지: M3 범위(12-M3: 백필 확대·일일 cron 가동·컬렉션·트렌딩) + 6.4 삭제 감지 + 6.5 컬렉션 상세 규칙(is_pinned 보호, 6~10세트) + 원장 이월(파이프라인 3건·웹 7건) 전부 태스크 매핑. metadataBase·sitemap·도메인은 M4 명시 이월
- 플레이스홀더: 없음. Task 6·7·8은 컨트롤러 수행 태스크로 명령·기대값 명시
- 타입 일관성: `trending_delta`가 스키마(0002)→LIST_COLS→SkillListItem→정렬·홈 사용까지 일관, `CollectionInput`/`GeneratedCollection`/`CollectionSummary` 시그니처가 생성→발행→웹 조회에서 일치, run.ts의 notes 병합 방식 확인
