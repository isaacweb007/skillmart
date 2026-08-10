import { CATEGORIES } from "../claude/analyze.js";

/** 언어별 검색어. 스킬과 무관한 일반 Claude 영상이 섞이지 않게 '스킬'을 반드시 포함시킨다. */
const QUERIES: Record<string, string[]> = {
  ko: ["클로드 스킬", "Claude Code 스킬"],
  vi: ["Claude skill", "Claude Code skill tiếng Việt"],
  en: ["Claude skills tutorial", "Claude Code skill"],
};

/** ponytail: AI 채점 없이 기계 필터만 쓴다. 저품질 양산 영상 상당수가 걸러지고 비용이 0이다.
 *  통과율이 나빠지면 그때 Claude 한 줄 채점을 붙인다(스킬 1건보다 훨씬 싸다). */
export const FILTER = {
  maxAgeDays: 14, // 최근 것만
  minViews: 300, // 아무도 안 본 양산 영상 제외
  minDurationSeconds: 120, // 2분 미만 쇼츠·예고 제외
  perLocale: 9, // 사용자 요청: 하루 10개 미만
};

export interface VideoRow {
  video_id: string;
  locale: string;
  title: string;
  channel_title: string;
  thumbnail_url: string;
  published_at: string;
  views: number;
  duration_seconds: number;
  category: string | null;
}

/** ISO 8601 재생 길이(PT1H2M3S)를 초로. 파싱 실패 시 0 — 필터에서 탈락한다. */
export function parseDuration(iso: string): number {
  const m = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  const [, d, h, min, s] = m;
  return Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(s ?? 0);
}

/** 제목·설명에서 코너를 추측한다. 못 찾으면 null (표시에는 문제 없음) */
const CATEGORY_HINTS: Record<string, string[]> = {
  "docs-office": ["ppt", "슬라이드", "엑셀", "excel", "문서", "docx", "pdf", "word", "trình bày"],
  "dev-coding": ["코드", "코딩", "code", "coding", "debug", "리팩터", "refactor", "git"],
  "design-ui": ["디자인", "design", "ui", "ux", "figma"],
  "marketing-seo": ["마케팅", "marketing", "seo", "광고", "ads", "카피"],
  "content-writing": ["글쓰기", "블로그", "blog", "writing", "카피라이팅", "콘텐츠"],
  "image-video": ["이미지", "영상", "image", "video", "썸네일", "thumbnail"],
  "data-analytics": ["데이터", "분석", "data", "analy", "csv", "sql"],
  "automation-workflow": ["자동화", "워크플로", "automat", "workflow", "n8n", "zapier"],
  "web-api": ["api", "웹훅", "webhook", "mcp", "연동", "integrat"],
  "security-review": ["보안", "security", "리뷰", "review", "취약"],
  education: ["강의", "배우", "튜토리얼", "tutorial", "입문", "기초", "beginner", "학습"],
  utility: [],
};

export function guessCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const category of CATEGORIES) {
    const hints = CATEGORY_HINTS[category] ?? [];
    if (hints.some((h) => lower.includes(h))) return category;
  }
  return null;
}

export interface RawCandidate {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  views: number;
  durationIso: string;
}

/** 필터 통과 여부. now를 인자로 받아 테스트가 시각에 의존하지 않게 한다. */
export function passesFilter(c: RawCandidate, now: Date): boolean {
  const ageDays = (now.getTime() - new Date(c.publishedAt).getTime()) / 86_400_000;
  if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > FILTER.maxAgeDays) return false;
  if (c.views < FILTER.minViews) return false;
  if (parseDuration(c.durationIso) < FILTER.minDurationSeconds) return false;
  return true;
}

/** 조회수 내림차순으로 상위 n개. 같은 영상이 여러 검색어에 걸리면 하나만 남긴다. */
export function selectTop(candidates: RawCandidate[], n: number): RawCandidate[] {
  const seen = new Set<string>();
  return candidates
    .filter((c) => (seen.has(c.videoId) ? false : (seen.add(c.videoId), true)))
    .sort((a, b) => b.views - a.views)
    .slice(0, n);
}

interface SearchItem {
  id?: { videoId?: string };
}
interface VideoItem {
  id: string;
  snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails: Record<string, { url: string }> };
  statistics?: { viewCount?: string };
  contentDetails?: { duration?: string };
}

async function api<T>(path: string, params: Record<string, string>, key: string): Promise<T> {
  const qs = new URLSearchParams({ ...params, key });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${qs}`);
  if (!res.ok) throw new Error(`YouTube ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

/** 언어별로 검색 → 상세 조회 → 필터 → 상위 N개를 DB 행 모양으로 반환 */
export async function fetchVideos(apiKey: string, now = new Date()): Promise<VideoRow[]> {
  const out: VideoRow[] = [];
  for (const [locale, queries] of Object.entries(QUERIES)) {
    const ids = new Set<string>();
    for (const q of queries) {
      try {
        const data = await api<{ items?: SearchItem[] }>(
          "search",
          {
            part: "id",
            q,
            type: "video",
            order: "date",
            maxResults: "25",
            relevanceLanguage: locale,
            publishedAfter: new Date(now.getTime() - FILTER.maxAgeDays * 86_400_000).toISOString(),
          },
          apiKey,
        );
        for (const it of data.items ?? []) if (it.id?.videoId) ids.add(it.id.videoId);
      } catch (e) {
        console.warn(`유튜브 검색 실패 (${locale}/${q}): ${(e as Error).message}`);
      }
    }
    if (ids.size === 0) continue;

    let candidates: RawCandidate[] = [];
    try {
      const detail = await api<{ items?: VideoItem[] }>(
        "videos",
        { part: "snippet,statistics,contentDetails", id: [...ids].join(",") },
        apiKey,
      );
      candidates = (detail.items ?? []).map((v) => ({
        videoId: v.id,
        title: v.snippet.title,
        channelTitle: v.snippet.channelTitle,
        thumbnailUrl:
          v.snippet.thumbnails.medium?.url ?? v.snippet.thumbnails.default?.url ?? "",
        publishedAt: v.snippet.publishedAt,
        views: Number(v.statistics?.viewCount ?? 0),
        durationIso: v.contentDetails?.duration ?? "",
      }));
    } catch (e) {
      console.warn(`유튜브 상세 조회 실패 (${locale}): ${(e as Error).message}`);
      continue;
    }

    const picked = selectTop(candidates.filter((c) => passesFilter(c, now)), FILTER.perLocale);
    for (const c of picked) {
      out.push({
        video_id: c.videoId,
        locale,
        title: c.title,
        channel_title: c.channelTitle,
        thumbnail_url: c.thumbnailUrl,
        published_at: c.publishedAt,
        views: c.views,
        duration_seconds: parseDuration(c.durationIso),
        category: guessCategory(c.title),
      });
    }
    console.log(`유튜브 ${locale}: 후보 ${candidates.length} → 채택 ${picked.length}`);
  }
  return out;
}
