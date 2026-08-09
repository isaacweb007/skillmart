import type { Octokit } from "@octokit/rest";

export interface Candidate {
  repoFullName: string;
  path: string;
  raw: string;
  stars: number;
  forks: number;
  lastCommitAt: string | null; // 저장소 pushed_at 사용 (스킬별 커밋 조회는 비용 대비 과잉)
  license: string | null;
  sourceUrl: string;
  isOfficial: boolean;
}

// 시드 저장소는 운영자가 관리한다. 추가 발견 시 여기에 늘린다.
const SEED_REPOS = ["anthropics/skills", "daymade/claude-code-skills"];
const TOPICS = ["claude-skills", "claude-code-skills", "claude-code-plugin"];
const MAX_SEARCH_REPOS = 300; // 런당 검색으로 새로 스캔할 저장소 상한 (초과분은 다음 런 이월)
const TOPIC_PAGES = 6; // 토픽당 50 × 6 = 최대 300
const CODE_PAGES = 4;
const MAX_PATHS_PER_REPO = 200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isSkillMdPath(path: string): boolean {
  return /(^|\/)SKILL\.md$/i.test(path);
}

interface RepoInfo {
  full_name: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string | null;
  license: { spdx_id?: string | null } | null;
}

export async function discover(octokit: Octokit, maxCandidates: number): Promise<Candidate[]> {
  const repos = new Map<string, RepoInfo>();

  // 1) 시드 저장소 (최우선, 실패해도 계속)
  for (const full of SEED_REPOS) {
    const [owner, repo] = full.split("/");
    try {
      const { data } = await octokit.repos.get({ owner, repo });
      repos.set(data.full_name, data as RepoInfo);
    } catch (e) {
      console.warn(`시드 저장소 ${full} 조회 실패: ${(e as Error).message}`);
    }
  }

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

  // 3) 전역 코드 검색 (베스트 에포트 — API가 거부하면 건너뛴다)
  try {
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
  } catch (e) {
    console.warn(`코드 검색 건너뜀: ${(e as Error).message}`);
  }

  // 4) 저장소별 트리 스캔 → SKILL.md 수집
  const out: Candidate[] = [];
  for (const repo of repos.values()) {
    if (out.length >= maxCandidates) break;
    const [owner, name] = repo.full_name.split("/");
    const paths = await findSkillMdPaths(octokit, owner, name, repo.default_branch);
    for (const path of paths) {
      if (out.length >= maxCandidates) break;
      const raw = await fetchRaw(octokit, owner, name, path);
      if (!raw) continue;
      out.push({
        repoFullName: repo.full_name,
        path,
        raw,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        lastCommitAt: repo.pushed_at ?? null,
        license: repo.license?.spdx_id ?? null,
        sourceUrl: `https://github.com/${repo.full_name}/blob/${repo.default_branch}/${path}`,
        isOfficial: repo.full_name.startsWith("anthropics/"),
      });
    }
  }
  return out;
}

async function findSkillMdPaths(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
): Promise<string[]> {
  try {
    const { data } = await octokit.git.getTree({ owner, repo, tree_sha: branch, recursive: "1" });
    return data.tree
      .filter((e) => e.type === "blob" && isSkillMdPath(e.path ?? ""))
      .map((e) => e.path as string)
      .slice(0, MAX_PATHS_PER_REPO);
  } catch {
    return [];
  }
}

async function fetchRaw(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data) && data.type === "file" && data.content) {
      return Buffer.from(data.content, "base64").toString("utf8");
    }
  } catch {
    // 404, 서브모듈 등은 무시
  }
  return null;
}
