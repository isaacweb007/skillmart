# M4-A SEO 오픈 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** skillmart.dev(canonical, apex 확정)를 구글·네이버가 제대로 색인하도록 전 페이지 canonical·절대 hreflang(x-default)·sitemap.xml·robots.txt를 구현한다.

**Architecture:** `lib/site.ts`에 SITE_URL 상수와 절대 URL alternates 빌더를 두고, 4개 페이지의 generateMetadata가 이를 공유한다. sitemap은 앱 루트 `app/sitemap.ts`(ISR 1h)에서 Supabase의 visible 스킬 전량(페이지네이션)과 컬렉션을 읽어 로케일 3종 × URL을 xhtml:link alternates와 함께 낸다.

**Tech Stack:** Next.js 15 App Router(Metadata API·MetadataRoute), next-intl v4, supabase-js, TypeScript ^6, Node 26.

## Global Constraints

- SITE_URL은 `https://skillmart.dev` **하드코딩** (도메인 구매·canonical 확정 완료 — 절대 변하지 않는 값에 env 금지)
- hreflang·canonical은 **절대 URL로 직접 생성** — metadataBase 해석에 의존하지 않는다 (metadataBase는 OG용으로만 설정)
- x-default는 **ko** URL (사이트 `/`가 `/ko`로 307하는 실동작과 일치)
- `/skills`의 쿼리 변형(`?q=`, `?category=`, `?page=` 등)은 전부 기본 목록 `/{locale}/skills`로 canonical 정규화
- Supabase는 요청당 1000행 상한 — sitemap 조회는 `.range()` 루프 페이지네이션 필수 (M3-T2에서 이미 밟은 함정)
- **dev 서버 가동 중 `next build` 금지** (.next 공유 충돌 — M2 운영 교훈). 빌드 전 3000 포트의 next-server만 골라 종료
- 로케일 목록은 `routing.locales`(ko/vi/en) 단일 소스 재사용 — 새 상수로 중복 정의 금지
- 커밋 메시지는 저장소 관례(한국어, `feat(web):` 프리픽스) 유지, 브랜치 `m4-open`
- 테스트 관례: apps/web에는 단위 테스트 러너가 없음(저장소 관례 — 웹은 실측 스모크로 검증). 본 계획의 검증은 Task 4의 프로덕션 빌드 + curl 단언이 담당한다. 선언형 메타데이터 코드라 TDD 테스트-선행 대신 산출물 단언을 쓴다.

---

### Task 1: SEO 기반 — site.ts 상수·alternates 빌더 + layout metadataBase/OG

**Files:**
- Create: `apps/web/lib/site.ts`
- Modify: `apps/web/app/[locale]/layout.tsx:1-26` (import 추가 + generateMetadata 반환 확장)

**Interfaces:**
- Consumes: `routing.locales` (`apps/web/i18n/routing.ts`, `["ko","vi","en"]`)
- Produces: `SITE_URL: string`, `pageAlternates(locale: string, path: string): NonNullable<Metadata["alternates"]>`, `sitemapLanguages(path: string): Record<string, string>` — Task 2·3이 그대로 import한다. `path`는 로케일 제외 경로(`""`, `"/skills"`, `` `/skills/${slug}` ``, `` `/collections/${slug}` ``)

- [x] **Step 1: 브랜치 생성 + 잔여 쓰레기 디렉토리 정리**

과거 셸 실수로 생긴 리터럴 `\[locale\]` 빈 디렉토리(git 미추적)를 지운다.

```bash
cd /Users/isaac/Downloads/클로드스킬마트
git checkout -b m4-open
rm -rf 'apps/web/app/\[locale\]'
ls apps/web/app/   # 기대: [locale] 과 globals.css 만
```

- [x] **Step 2: `apps/web/lib/site.ts` 생성**

```ts
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export const SITE_URL = "https://skillmart.dev";

const abs = (locale: string, path: string) => `${SITE_URL}/${locale}${path}`;

/** 로케일 제외 경로("" | "/skills" | `/skills/${slug}` …)를 받아
 *  자기 canonical + 3개 언어 + x-default(ko) 절대 URL 세트를 만든다 */
export function pageAlternates(
  locale: string,
  path: string,
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: abs(locale, path),
    languages: sitemapLanguages(path),
  };
}

/** hreflang 맵 (페이지 alternates.languages와 sitemap 항목이 공유) */
export function sitemapLanguages(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((l) => [l, abs(l, path)])),
    "x-default": abs("ko", path),
  };
}
```

- [x] **Step 3: layout.tsx generateMetadata 확장**

`apps/web/app/[locale]/layout.tsx`의 import에 한 줄 추가:

```ts
import { SITE_URL } from "@/lib/site";
```

기존 generateMetadata의 return(20~25행)을 다음으로 교체:

```ts
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("brand"), template: `%s — ${t("brand")}` },
    description: t("tagline"),
    openGraph: {
      siteName: t("brand"),
      type: "website",
      locale,
    },
  };
```

- [x] **Step 4: 타입체크**

```bash
npm run typecheck -w web
```
기대: 출력 없이 종료(에러 0).

- [x] **Step 5: Commit**

```bash
git add apps/web/lib/site.ts 'apps/web/app/[locale]/layout.tsx'
git commit -m "feat(web): SEO 기반 — SITE_URL 상수·절대 alternates 빌더·metadataBase·OG 기본값"
```

---

### Task 2: 전 페이지 canonical + 절대 hreflang(x-default)

**Files:**
- Modify: `apps/web/app/[locale]/page.tsx` (generateMetadata 신규, import 1줄)
- Modify: `apps/web/app/[locale]/skills/page.tsx` (generateMetadata 신규, import 1줄)
- Modify: `apps/web/app/[locale]/skills/[slug]/page.tsx:15-26` (alternates 교체)
- Modify: `apps/web/app/[locale]/collections/[slug]/page.tsx:14-24` (alternates 교체)

**Interfaces:**
- Consumes: `pageAlternates(locale, path)` (Task 1)
- Produces: 없음 (말단)

- [x] **Step 1: 홈에 generateMetadata 추가**

`apps/web/app/[locale]/page.tsx` — import에 추가:

```ts
import type { Metadata } from "next";
import { pageAlternates } from "@/lib/site";
```

`export const revalidate = 3600;` 바로 아래 삽입 (title 없음 — layout 기본 title 상속):

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: pageAlternates(locale, "") };
}
```

- [x] **Step 2: 스킬 목록에 generateMetadata 추가**

`apps/web/app/[locale]/skills/page.tsx` — import에 추가:

```ts
import type { Metadata } from "next";
import { pageAlternates } from "@/lib/site";
```

`export const revalidate = 3600;` 바로 아래 삽입 (title은 기존 메시지 키 `list.title` 재사용 — 신규 번역 불필요. 쿼리 변형은 전부 이 기본 canonical로 정규화됨):

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("list.title"), alternates: pageAlternates(locale, "/skills") };
}
```

- [x] **Step 3: 스킬 상세 alternates 교체**

`apps/web/app/[locale]/skills/[slug]/page.tsx` — import 정리: `routing` import 줄(`import { routing } from "@/i18n/routing";`)을 삭제하고 추가:

```ts
import { pageAlternates } from "@/lib/site";
```

generateMetadata의 return을 교체:

```ts
  return {
    title: skill.name,
    description: skill.one_liner,
    alternates: pageAlternates(locale, `/skills/${slug}`),
  };
```

- [x] **Step 4: 컬렉션 상세 alternates 교체**

`apps/web/app/[locale]/collections/[slug]/page.tsx` — 같은 방식. `routing` import 삭제, `pageAlternates` import 추가, return 교체:

```ts
  return {
    title: data.summary.title,
    description: data.summary.description,
    alternates: pageAlternates(locale, `/collections/${slug}`),
  };
```

- [x] **Step 5: 타입체크**

```bash
npm run typecheck -w web
```
기대: 에러 0. (routing import 삭제 후 미사용 경고/에러 없어야 함 — 상세 페이지 본문에서 routing을 더 쓰지 않는지 grep으로 확인: `grep -n "routing" 'apps/web/app/[locale]/skills/[slug]/page.tsx' 'apps/web/app/[locale]/collections/[slug]/page.tsx'` → import 삭제 후 0건이어야)

- [x] **Step 6: Commit**

```bash
git add 'apps/web/app/[locale]/page.tsx' 'apps/web/app/[locale]/skills/page.tsx' 'apps/web/app/[locale]/skills/[slug]/page.tsx' 'apps/web/app/[locale]/collections/[slug]/page.tsx'
git commit -m "feat(web): 전 페이지 canonical + 절대 hreflang(x-default=ko)"
```

---

### Task 3: sitemap.xml · robots.txt

**Files:**
- Modify: `apps/web/lib/db.ts` (getAllVisibleForSitemap 추가 — 파일 끝)
- Create: `apps/web/app/sitemap.ts`
- Create: `apps/web/app/robots.ts`

**Interfaces:**
- Consumes: `SITE_URL`, `sitemapLanguages(path)` (Task 1), `getCollections(locale)` (기존 db.ts — visible 0건 컬렉션 제외 로직 내장)
- Produces: `getAllVisibleForSitemap(): Promise<{ slug: string; updated_at: string }[]>`

- [x] **Step 1: db.ts에 sitemap 조회 헬퍼 추가** (파일 끝에)

```ts
export interface SitemapSkill {
  slug: string;
  updated_at: string;
}

/** visible 스킬 전량의 slug·updated_at — Supabase 1000행 상한 대응 페이지네이션 */
export async function getAllVisibleForSitemap(): Promise<SitemapSkill[]> {
  const CHUNK = 1000;
  const out: SitemapSkill[] = [];
  for (let from = 0; ; from += CHUNK) {
    const { data, error } = await db
      .from("skills")
      .select("slug, updated_at")
      .eq("status", "visible")
      .order("slug")
      .range(from, from + CHUNK - 1);
    if (error) throw new Error(`sitemap skills 조회 실패: ${error.message}`);
    out.push(...(data as SitemapSkill[]));
    if (data.length < CHUNK) break;
  }
  return out;
}
```

- [x] **Step 2: `apps/web/app/sitemap.ts` 생성** ([locale] 밖, 앱 루트 — URL은 `/sitemap.xml`. 미들웨어 matcher가 점(.) 포함 경로를 제외하므로 i18n 리다이렉트에 안 걸린다)

```ts
import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllVisibleForSitemap, getCollections } from "@/lib/db";
import { SITE_URL, sitemapLanguages } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 컬렉션 locale 인자는 제목 선택용일 뿐 — slug·visible 필터는 locale 무관이라 ko로 고정
  const [skills, collections] = await Promise.all([
    getAllVisibleForSitemap(),
    getCollections("ko"),
  ]);

  const entries: MetadataRoute.Sitemap = [];
  const add = (path: string, lastModified?: Date) => {
    const languages = sitemapLanguages(path);
    for (const l of routing.locales) {
      entries.push({ url: `${SITE_URL}/${l}${path}`, lastModified, alternates: { languages } });
    }
  };

  add("");
  add("/skills");
  for (const s of skills) add(`/skills/${s.slug}`, new Date(s.updated_at));
  for (const c of collections) add(`/collections/${c.slug}`);
  return entries;
}
```

- [x] **Step 3: `apps/web/app/robots.ts` 생성**

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [x] **Step 4: 타입체크**

```bash
npm run typecheck -w web
```
기대: 에러 0.

- [x] **Step 5: Commit**

```bash
git add apps/web/lib/db.ts apps/web/app/sitemap.ts apps/web/app/robots.ts
git commit -m "feat(web): sitemap.xml·robots.txt — visible 전 스킬·컬렉션 ×3언어, hreflang alternates"
```

---

### Task 4: 프로덕션 빌드 스모크 (실측 단언)

**Files:**
- 없음 (검증 전용 — 결함 발견 시에만 수정 커밋)

**Interfaces:**
- Consumes: Task 1~3 전부, `apps/web/.env.local`(Supabase 키 — 빌드 시 프리렌더가 실DB 조회)

- [x] **Step 1: 3000 포트의 남은 next-server만 골라 종료** (dev 서버와 build 동시 실행 금지 — .next 충돌)

```bash
for pid in $(lsof -nP -iTCP:3000 -sTCP:LISTEN -t); do
  ps -p "$pid" -o comm= | grep -q "next-server" && kill "$pid" && echo "killed $pid"
done
lsof -nP -iTCP:3000 -sTCP:LISTEN || echo "3000 비었음"
```
기대: next-server만 죽고 다른 앱(Claude/ChatGPT 헬퍼)은 건드리지 않음.

- [x] **Step 2: 프로덕션 빌드**

```bash
npm run build -w web
```
기대: `✓ Compiled` + 라우트 표에 `/sitemap.xml`, `/robots.txt` 등장, 에러 0.

- [x] **Step 3: 프로덕션 서버 기동 + curl 단언 5종**

```bash
(cd apps/web && npx next start -p 3400 &) && sleep 4
# 1) robots
curl -s http://localhost:3400/robots.txt
# 기대: "Sitemap: https://skillmart.dev/sitemap.xml" 포함, "Allow: /"
# 2) sitemap 규모 — visible 490+ 기준 (490+10+2)×3 = 1506± 이상
curl -s http://localhost:3400/sitemap.xml | grep -c "<url>"
# 기대: >= 1470
# 3) x-default 존재
curl -s http://localhost:3400/sitemap.xml | grep -c 'hreflang="x-default"'
# 기대: 항목마다 1개 → <url> 수와 동일 자릿수
# 4) 홈 canonical + hreflang 절대 URL
curl -s http://localhost:3400/ko | grep -o '<link rel="canonical"[^>]*>'
# 기대: href="https://skillmart.dev/ko"
curl -s http://localhost:3400/ko | grep -o 'hreflang="[^"]*" href="https://skillmart.dev[^"]*"' | sort -u
# 기대: ko / vi / en / x-default 4줄, 전부 절대 URL
# 5) 상세 페이지 hreflang (실존 slug 하나로)
SLUG=$(curl -s http://localhost:3400/sitemap.xml | grep -o 'skills/[a-z0-9-]*' | head -1 | cut -d/ -f2)
curl -s "http://localhost:3400/ko/skills/$SLUG" | grep -c 'hreflang='
# 기대: >= 4
```

- [x] **Step 4: 서버 종료**

```bash
lsof -nP -iTCP:3400 -sTCP:LISTEN -t | xargs kill
```

- [x] **Step 5: 결함 있으면 수정 후 재검증·커밋**

```bash
git add -A apps/web && git commit -m "fix(web): SEO 스모크 반영 — <발견 내용>"
```
(무결함이면 이 스텝 생략)

---

### Task 5: 배포 + 검색엔진 등록 (사용자 동행 — 코드 작업 아님)

**Files:**
- 없음 (배포·대시보드 작업. Naver 메타태그 수신 시에만 layout.tsx 1줄 커밋)

- [ ] **Step 1: master 머지·push는 사용자 확인 후** (push = Vercel 프로덕션 자동 배포)

```bash
git checkout master && git merge --no-ff m4-open -m "Merge branch 'm4-open': M4-A SEO 오픈 — canonical·hreflang·sitemap·robots" && git push
```

- [ ] **Step 2: 프로덕션 검증**

```bash
curl -s https://skillmart.dev/robots.txt
curl -s https://skillmart.dev/sitemap.xml | grep -c "<url>"
```

- [ ] **Step 3: Google Search Console 등록 안내** (사용자 클릭 작업 — 대화로 안내)
  - https://search.google.com/search-console → 도메인 속성 `skillmart.dev` → DNS TXT 값 발급 → Cloudflare DNS에 TXT 추가 → 확인 → Sitemaps 메뉴에 `sitemap.xml` 제출

- [ ] **Step 4: 네이버 서치어드바이저 등록 안내** (사용자 클릭 작업)
  - https://searchadvisor.naver.com → 사이트 등록 `https://skillmart.dev` → HTML 메타태그 방식 선택 → 태그의 content 값을 받아오면 layout.tsx generateMetadata에 아래 1줄 추가 후 커밋·배포:

```ts
    verification: { other: { "naver-site-verification": "<사용자가 받은 값>" } },
```

  - 재배포 후 네이버에서 소유 확인 → 사이트맵 제출 `https://skillmart.dev/sitemap.xml`

---

## Self-Review 결과

1. **스펙 커버리지**: metadataBase(T1)·절대 hreflang(T1 빌더+T2 적용)·x-default(T1 빌더)·canonical(T2)·sitemap(T3)·robots(T3)·Search Console+네이버(T5) — 전부 태스크 매핑됨. 도메인·canonical 확정은 이 계획 전에 완료.
2. **플레이스홀더 스캔**: T5 Step 4의 `<사용자가 받은 값>`은 외부 발급값이라 사전 기재 불가(실행 시 사용자에게 수신) — 그 외 없음.
3. **타입 일관성**: `pageAlternates(locale, path)`·`sitemapLanguages(path)`·`SITE_URL`·`getAllVisibleForSitemap()` 시그니처가 T1 정의 = T2/T3 사용처 일치. `SitemapSkill.updated_at`은 0001 마이그레이션의 `updated_at timestamptz not null` 실존 컬럼.
