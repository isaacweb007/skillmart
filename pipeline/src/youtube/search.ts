import { CATEGORIES } from "../claude/analyze.js";

/** 언어별 검색어. 스킬과 무관한 일반 Claude 영상이 섞이지 않게 '스킬'을 반드시 포함시킨다. */
const QUERIES: Record<string, string[]> = {
  ko: ["클로드 스킬", "Claude Code 스킬", "클로드코드 스킬 사용법"],
  vi: ["Claude skill tiếng Việt", "Claude Code skill hướng dẫn", "Claude AI skill"],
  en: ["Claude skills tutorial", "Claude Code skill", "Claude agent skills"],
};

/** ponytail: AI 채점 없이 기계 필터만 쓴다. 저품질 양산 영상 상당수가 걸러지고 비용이 0이다.
 *  통과율이 나빠지면 그때 Claude 한 줄 채점을 붙인다(스킬 1건보다 훨씬 싸다). */
export const FILTER = {
  maxAgeDays: 21, // 최근 것만. ko보다 vi·en 공급이 적어 3주까지 본다
  minViews: 200, // 아무도 안 본 양산 영상 제외
  minDurationSeconds: 120, // 2분 미만 쇼츠·예고 제외
  maxDurationSeconds: 3600, // 1시간 초과는 라이브 아카이브·전체 강의 — 매일 보는 큐레이션에 안 맞는다
  perLocale: 10, // 언어별 10개 (사용자 요청)
};

/* 언어 판별 — YouTube의 relevanceLanguage는 힌트일 뿐 강제가 아니다.
   실측에서 vi 결과에 독일어·일본어가, ko 1위에 영어 영상이 섞였다. 제목 문자로 직접 가른다. */
const HANGUL = /[\uAC00-\uD7AF]/;
// 베트남어 전용 문자만 쓴다 — à á é í ó ú 같은 공용 발음부호를 넣으면
// 프랑스어·스페인어 제목까지 베트남어로 오판한다. U+1EA0~1EF9는 사실상 베트남어 전용 구간.
const VIETNAMESE = /[ăâđêôơưĂÂĐÊÔƠƯ\u1EA0-\u1EF9]/;
const JP_HAN = /[\u3040-\u30FF\u4E00-\u9FFF]/; // 히라가나·가타카나·한자
const CYRILLIC = /[\u0400-\u04FF]/;

/** 제목에 Claude가 없으면 제외 — 실측에서 ChatGPT 스킬 영상과 일반 AI 돈벌이 영상이 섞였다. */
export function mentionsClaude(title: string): boolean {
  return /claude|클로드/i.test(title);
}

/** 제목이 해당 언어권 영상인지. ko는 한글, vi는 베트남 전용 문자, en은 CJK·키릴이 없을 때만. */
export function matchesLocale(title: string, locale: string): boolean {
  if (locale === "ko") return HANGUL.test(title);
  if (locale === "vi") return VIETNAMESE.test(title);
  // en은 다른 문자권 제목을 전부 제외 — 베트남어 제목이 en 목록에 섞이던 문제
  return (
    !HANGUL.test(title) &&
    !JP_HAN.test(title) &&
    !CYRILLIC.test(title) &&
    !VIETNAMESE.test(title)
  );
}

export interface VideoRow {
  video_id: string;
  locale: string;
  title: string;
  channel_title: string;
  thumbnail_url: string;
  published_at: string;
  views: number;
  duration_seconds: number;
  has_caption: boolean;
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
  hasCaption: boolean;
}

/** 필터 통과 여부. now를 인자로 받아 테스트가 시각에 의존하지 않게 한다. */
export function passesFilter(c: RawCandidate, now: Date, locale?: string): boolean {
  const ageDays = (now.getTime() - new Date(c.publishedAt).getTime()) / 86_400_000;
  if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > FILTER.maxAgeDays) return false;
  if (c.views < FILTER.minViews) return false;
  const seconds = parseDuration(c.durationIso);
  if (seconds < FILTER.minDurationSeconds || seconds > FILTER.maxDurationSeconds) return false;
  if (!mentionsClaude(c.title)) return false;
  if (locale && !matchesLocale(c.title, locale)) return false;
  return true;
}

/** 자막 있는 영상을 먼저, 그 안에서 조회수 내림차순으로 상위 n개.
 *  하드 필터가 아니라 우선순위다 — 자막 영상이 n개보다 적으면 나머지로 채운다(목록이 비지 않게).
 *  같은 영상이 여러 검색어에 걸리면 하나만 남긴다. */
export function selectTop(candidates: RawCandidate[], n: number): RawCandidate[] {
  const seen = new Set<string>();
  return candidates
    .filter((c) => (seen.has(c.videoId) ? false : (seen.add(c.videoId), true)))
    .sort((a, b) => Number(b.hasCaption) - Number(a.hasCaption) || b.views - a.views)
    .slice(0, n);
}

interface SearchItem {
  id?: { videoId?: string };
}
interface VideoItem {
  id: string;
  snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails: Record<string, { url: string }> };
  statistics?: { viewCount?: string };
  contentDetails?: { duration?: string; caption?: string };
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
    // 각 검색어를 두 번 돌린다: 일반 + 자막 보유 한정.
    // 자막 한정만 쓰면 후보가 말라 목록이 비고, 일반만 쓰면 자막 영상이 거의 안 들어온다.
    const passes = queries.flatMap((q) => [
      { q, caption: undefined as string | undefined },
      { q, caption: "closedCaption" },
    ]);
    for (const pass of passes) {
      const q = pass.q;
      try {
        const data = await api<{ items?: SearchItem[] }>(
          "search",
          {
            part: "id",
            q,
            type: "video",
            ...(pass.caption ? { videoCaption: pass.caption } : {}),
            // viewCount로 정렬한다. date로 받으면 갓 올라온 조회수 0~200 영상이
            // 결과를 채워 저조회 탈락이 후보의 57%였다(실측). 기간은 publishedAfter가 이미 제한한다.
            order: "viewCount",
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
      // videos.list는 id를 50개까지만 받는다 — 초과하면 400 invalid filter parameter
      const idList = [...ids];
      const items: VideoItem[] = [];
      for (let i = 0; i < idList.length; i += 50) {
        const detail = await api<{ items?: VideoItem[] }>(
          "videos",
          { part: "snippet,statistics,contentDetails", id: idList.slice(i, i + 50).join(",") },
          apiKey,
        );
        items.push(...(detail.items ?? []));
      }
      candidates = items.map((v) => ({
        videoId: v.id,
        title: v.snippet.title,
        channelTitle: v.snippet.channelTitle,
        thumbnailUrl:
          v.snippet.thumbnails.medium?.url ?? v.snippet.thumbnails.default?.url ?? "",
        publishedAt: v.snippet.publishedAt,
        views: Number(v.statistics?.viewCount ?? 0),
        durationIso: v.contentDetails?.duration ?? "",
        hasCaption: v.contentDetails?.caption === "true",
      }));
    } catch (e) {
      console.warn(`유튜브 상세 조회 실패 (${locale}): ${(e as Error).message}`);
      continue;
    }

    const picked = selectTop(
      candidates.filter((c) => passesFilter(c, now, locale)),
      FILTER.perLocale,
    );
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
        has_caption: c.hasCaption,
        category: guessCategory(c.title),
      });
    }
    console.log(
      `유튜브 ${locale}: 후보 ${candidates.length} → 채택 ${picked.length} (자막 ${picked.filter((c) => c.hasCaption).length}건)`,
    );
  }
  return out;
}
