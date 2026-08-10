# 검색 노출 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 코너 12개를 색인 가능한 페이지로 노출하고, 전 페이지 제목·설명을 검색 의도에 맞게 다시 쓰고, JSON-LD 구조화 데이터를 넣는다.

**Architecture:** 새 라우트를 만들지 않는다 — 기존 `/skills?category=X`가 코너 페이지 역할을 하도록, **코너만 지정된 변형에서 자기 canonical**을 내주고 제목·설명·H1을 코너별로 바꾸고 sitemap에 12×3을 추가한다. JSON-LD는 `lib/jsonld.ts`의 순수 빌더 + 페이지에서 `<script type="application/ld+json">` 삽입.

**Tech Stack:** Next 15 Metadata API, next-intl v4 (ICU 보간), schema.org (BreadcrumbList·SoftwareSourceCode·WebSite).

## Global Constraints

- **AI 점수를 `aggregateRating`으로 내보내지 않는다.** 사용자 평점이 아니라 자체 AI 평가이며, 별점으로 표기하면 구글 구조화 데이터 정책 위반(조작)에 해당해 역효과가 난다. `ratingValue` 계열 필드 전면 금지
- 코너 canonical은 **카테고리만 지정된 경우에만** 자기 URL. `q`·`page`·`difficulty`·`sort`가 섞이면 기존대로 `/skills`로 통합한다(무한 조합 색인 방지)
- sitemap의 쿼리 URL은 `&`를 XML 이스케이프해야 한다 — Next `MetadataRoute.Sitemap`이 처리하는지 Task 1에서 실측 확인
- 제목은 **절대 제목(`title.absolute`)** 으로 길이를 직접 통제한다. layout의 `%s — 브랜드` 템플릿에 맡기면 코너·목록에서 60자를 넘긴다
- 설명은 페이지마다 고유해야 한다. 스킬 상세는 기존 `one_liner`를 그대로 유지(528개 전부 고유) — 보일러플레이트 접미사를 붙이지 않는다
- 새 문자열은 ko/vi/en 3개 파일 모두. 키 누락 시 next-intl 런타임 에러
- JSON-LD 출력 시 `<`를 `<`로 이스케이프한다(스크립트 태그 탈출 방지)
- 커밋은 한국어 `feat(web):`, 브랜치 `m4-search`
- 로컬 검증 빌드는 `rm -rf apps/web/.next` 후

---

### Task 1: 코너 페이지 색인 노출

**Files:**
- Modify: `apps/web/app/[locale]/skills/page.tsx` (generateMetadata·H1)
- Modify: `apps/web/app/sitemap.ts` (코너 12개 추가)
- Modify: `apps/web/messages/{ko,vi,en}.json`

**Interfaces:**
- Consumes: `CATEGORIES` (`lib/categories.ts`), `pageAlternates` (`lib/site.ts`), `searchSkills`
- Produces: `/{locale}/skills?category={c}` 12×3 색인 가능 URL

- [ ] **Step 1: 브랜치 + 메시지 키 추가** (seo 섹션 신설)

```bash
cd /Users/isaac/Downloads/클로드스킬마트 && git checkout -b m4-search
```

세 파일 최상위에 `seo` 추가:

```
ko: "seo": {
  "homeTitle": "Claude Code 스킬 모음 — 클로드스킬마트",
  "homeDesc": "AI가 매일 GitHub에서 스킬을 발굴해 한국어로 풀어씁니다. 터미널 없이 Claude 앱에도 설치할 수 있습니다.",
  "listTitle": "Claude Code 스킬 {count}개 — 클로드스킬마트",
  "listDesc": "AI가 매일 발굴한 Claude Code 스킬 {count}개. 코너와 난이도로 골라 설치 방법까지 한국어로 봅니다.",
  "cornerTitle": "{corner} Claude Code 스킬 {count}개 — 클로드스킬마트",
  "cornerDesc": "{corner} 코너의 Claude Code 스킬 {count}개. 무엇을 해주는 스킬인지와 설치 방법을 한국어로 정리했습니다.",
  "skillTitle": "{name} — Claude Code 스킬 | 클로드스킬마트",
  "guideTitle": "Claude Code 스킬이란? 설치 방법 — 클로드스킬마트",
  "guideDesc": "스킬이 무엇인지, Claude 데스크톱·웹과 Claude Code에 각각 어떻게 설치하는지 한국어로 설명합니다."
}
vi: "seo": {
  "homeTitle": "Kho skill Claude Code — Claude Skill Mart",
  "homeDesc": "AI tìm skill trên GitHub mỗi ngày và diễn giải lại. Cài được cả trong ứng dụng Claude, không cần terminal.",
  "listTitle": "{count} skill cho Claude Code — Claude Skill Mart",
  "listDesc": "{count} skill Claude Code do AI tìm mỗi ngày. Chọn theo mục và độ khó, kèm cách cài đặt.",
  "cornerTitle": "Skill Claude Code: {corner} ({count}) — Claude Skill Mart",
  "cornerDesc": "{count} skill Claude Code trong mục {corner}. Skill làm được gì và cách cài đặt.",
  "skillTitle": "{name} — Skill Claude Code | Claude Skill Mart",
  "guideTitle": "Skill của Claude Code là gì? Cách cài — Claude Skill Mart",
  "guideDesc": "Skill là gì và cách cài vào Claude desktop/web cũng như Claude Code."
}
en: "seo": {
  "homeTitle": "Claude Code skills, picked daily — Claude Skill Mart",
  "homeDesc": "AI finds skills on GitHub every day and explains them plainly. Installable in the Claude app too, no terminal needed.",
  "listTitle": "{count} Claude Code skills — Claude Skill Mart",
  "listDesc": "{count} Claude Code skills found daily by AI. Filter by corner and level, with install steps for each.",
  "cornerTitle": "{corner} Claude Code skills ({count}) — Claude Skill Mart",
  "cornerDesc": "{count} Claude Code skills in {corner}. What each skill does and how to install it.",
  "skillTitle": "{name} — Claude Code skill | Claude Skill Mart",
  "guideTitle": "What is a Claude Code skill? How to install — Claude Skill Mart",
  "guideDesc": "What a Skill is and how to install one in the Claude desktop/web app and in Claude Code."
}
```

- [ ] **Step 2: 목록 페이지 generateMetadata를 코너 인식으로 교체**

`apps/web/app/[locale]/skills/page.tsx`의 generateMetadata를 다음으로 교체 (searchParams를 읽어 코너 전용 변형을 판별):

```tsx
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const raw = await searchParams;
  const t = await getTranslations({ locale });
  const category = first(raw.category);
  // 코너만 지정된 변형만 독립 페이지로 색인한다. 다른 파라미터가 섞이면 /skills로 통합
  const cornerOnly =
    category !== undefined &&
    (CATEGORIES as readonly string[]).includes(category) &&
    !first(raw.q) &&
    !first(raw.difficulty) &&
    !first(raw.sort) &&
    !first(raw.page);

  if (cornerOnly) {
    const corner = t(`categories.${category}`);
    const { total } = await searchSkills({ locale, category, sort: "rank", page: 1 });
    return {
      title: { absolute: t("seo.cornerTitle", { corner, count: total }) },
      description: t("seo.cornerDesc", { corner, count: total }),
      alternates: pageAlternates(locale, `/skills?category=${category}`),
    };
  }

  const { total } = await searchSkills({ locale, sort: "rank", page: 1 });
  return {
    title: { absolute: t("seo.listTitle", { count: total }) },
    description: t("seo.listDesc", { count: total }),
    alternates: pageAlternates(locale, "/skills"),
  };
}
```

- [ ] **Step 3: H1을 코너 이름으로** — 본문의 h1 줄을 교체

```tsx
      <h1 className="mb-4 font-display text-2xl font-bold">
        {sp.category && (CATEGORIES as readonly string[]).includes(sp.category)
          ? t(`categories.${sp.category}`)
          : t("list.title")}
      </h1>
```

- [ ] **Step 4: sitemap에 코너 12개 추가** — `add("/guide");` 뒤에 삽입

```ts
  for (const c of CATEGORIES) add(`/skills?category=${c}`);
```

`apps/web/app/sitemap.ts` 상단 import에 추가:

```ts
import { CATEGORIES } from "@/lib/categories";
```

- [ ] **Step 5: 타입체크 후 클린 빌드·검증**

```bash
npm run typecheck -w web
rm -rf apps/web/.next && npm run build -w web > /tmp/b.log 2>&1 && echo BUILD OK
(cd apps/web && npx next start -p 3410 > /tmp/s.log 2>&1 &) ; sleep 6
# 코너 페이지: 자기 canonical + 코너 제목
curl -s "http://localhost:3410/ko/skills?category=docs-office" | grep -oE '<title>[^<]*</title>|<link rel="canonical"[^>]*>|<meta name="description" content="[^"]*"'
# 코너+다른 파라미터: /skills로 통합되어야
curl -s "http://localhost:3410/ko/skills?category=docs-office&page=2" | grep -o '<link rel="canonical"[^>]*>'
# sitemap: 코너 36건 + XML 이스케이프 확인
curl -s http://localhost:3410/sitemap.xml | grep -c 'category='
curl -s http://localhost:3410/sitemap.xml | grep -o 'skills?category=docs-office' | head -1
curl -s http://localhost:3410/sitemap.xml | grep -c 'category=docs-office&amp;\|&amp;'
# H1
curl -s "http://localhost:3410/ko/skills?category=docs-office" | grep -oE '<h1[^>]*>[^<]*'
```
기대: 코너 제목이 `문서·오피스 Claude Code 스킬 39개 — 클로드스킬마트`, canonical이 `.../ko/skills?category=docs-office`, page=2 변형의 canonical은 `.../ko/skills`, sitemap에 category 36건, H1이 `문서·오피스`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/messages 'apps/web/app/[locale]/skills/page.tsx' apps/web/app/sitemap.ts
git commit -m "feat(web): 코너 12개를 색인 가능한 페이지로 노출 (자기 canonical·코너별 제목·sitemap)"
```

---

### Task 2: 제목·설명 검색 의도 반영 (홈·상세·안내)

**Files:**
- Modify: `apps/web/app/[locale]/page.tsx`
- Modify: `apps/web/app/[locale]/skills/[slug]/page.tsx`
- Modify: `apps/web/app/[locale]/guide/page.tsx`

**Interfaces:**
- Consumes: Task 1의 `seo.*` 메시지 키

- [ ] **Step 1: 홈** — generateMetadata 반환을 교체 (기존엔 alternates만 있었다)

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: { absolute: t("seo.homeTitle") },
    description: t("seo.homeDesc"),
    alternates: pageAlternates(locale, ""),
  };
}
```

- [ ] **Step 2: 스킬 상세** — title을 절대 제목으로 (description은 고유한 one_liner 유지)

```tsx
  return {
    title: { absolute: t("seo.skillTitle", { name: skill.name }) },
    description: skill.one_liner,
    alternates: pageAlternates(locale, `/skills/${slug}`),
  };
```

상세 페이지 generateMetadata에 `getTranslations`가 이미 import되어 있지 않으면 추가하고, `const t = await getTranslations({ locale });`를 skill 조회 뒤에 넣는다.

- [ ] **Step 3: 안내 페이지** — 제목·설명을 검색 의도 문구로

```tsx
  return {
    title: { absolute: t("seo.guideTitle") },
    description: t("seo.guideDesc"),
    alternates: pageAlternates(locale, "/guide"),
  };
```

- [ ] **Step 4: 검증**

```bash
npm run typecheck -w web
rm -rf apps/web/.next && npm run build -w web > /tmp/b.log 2>&1 && echo BUILD OK
(cd apps/web && npx next start -p 3410 > /tmp/s.log 2>&1 &) ; sleep 6
for P in /ko /ko/skills /ko/guide /ko/skills/skill-creator /vi /en/guide; do
  echo "$P → $(curl -s http://localhost:3410$P | grep -oE '<title>[^<]*</title>' | head -1)"
done
# 제목 길이 점검 (60자 초과는 잘린다)
curl -s http://localhost:3410/ko | python3 -c "import sys,re; t=re.search(r'<title>(.*?)</title>', sys.stdin.read()).group(1); print(len(t), t)"
```
기대: 홈·목록·안내·상세 제목이 각각 새 문구, 홈 제목 40자 이내.

- [ ] **Step 5: Commit**

```bash
git add 'apps/web/app/[locale]/page.tsx' 'apps/web/app/[locale]/skills/[slug]/page.tsx' 'apps/web/app/[locale]/guide/page.tsx'
git commit -m "feat(web): 제목·설명을 검색 의도 문구로 재작성 (절대 제목으로 길이 통제)"
```

---

### Task 3: JSON-LD 구조화 데이터

**Files:**
- Create: `apps/web/lib/jsonld.ts`
- Modify: `apps/web/app/[locale]/skills/[slug]/page.tsx`
- Modify: `apps/web/app/[locale]/page.tsx`

**Interfaces:**
- Produces: `jsonLd(data: object): string`, `breadcrumb(...)`, `softwareSourceCode(...)`, `webSite(...)`

- [ ] **Step 1: 빌더 작성**

`apps/web/lib/jsonld.ts`:

```ts
import { SITE_URL } from "./site";

/** 스크립트 태그 탈출 방지 — `<`를 유니코드 이스케이프한다 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumb(items: { name: string; path: string }[], locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}/${locale}${it.path}`,
    })),
  };
}

/** 스킬은 GitHub의 코드 자원이다. 사용자 평점이 없으므로 aggregateRating은 넣지 않는다. */
export function softwareSourceCode(input: {
  name: string;
  description: string;
  url: string;
  codeRepository: string;
  license: string | null;
  locale: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: input.name,
    description: input.description,
    url: input.url,
    codeRepository: input.codeRepository,
    inLanguage: input.locale,
    ...(input.license ? { license: input.license } : {}),
  };
}

export function webSite(name: string, description: string, locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    description,
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale,
  };
}
```

- [ ] **Step 2: 스킬 상세에 삽입** — import 추가

```tsx
import { breadcrumb, jsonLd, softwareSourceCode } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site";
```

`<article ...>` 바로 안쪽 첫 줄에 삽입:

```tsx
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            breadcrumb(
              [
                { name: t("brand"), path: "" },
                { name: t("list.title"), path: "/skills" },
                { name: skill.name, path: `/skills/${slug}` },
              ],
              locale,
            ),
            softwareSourceCode({
              name: skill.name,
              description: skill.one_liner,
              url: `${SITE_URL}/${locale}/skills/${slug}`,
              codeRepository: skill.source_url,
              license: skill.license,
              locale,
            }),
          ]),
        }}
      />
```

- [ ] **Step 3: 홈에 WebSite 삽입** — 최상위 `<div className="py-10">` 안쪽 첫 줄에

```tsx
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(webSite(t("brand"), t("seo.homeDesc"), locale)),
        }}
      />
```

홈 페이지 import에 추가:

```tsx
import { jsonLd, webSite } from "@/lib/jsonld";
```

- [ ] **Step 4: 검증** — JSON 유효성까지 파싱해 확인

```bash
npm run typecheck -w web
rm -rf apps/web/.next && npm run build -w web > /tmp/b.log 2>&1 && echo BUILD OK
(cd apps/web && npx next start -p 3410 > /tmp/s.log 2>&1 &) ; sleep 6
curl -s http://localhost:3410/ko/skills/skill-creator | python3 -c "
import sys, re, json
h = sys.stdin.read()
blocks = re.findall(r'<script type=\"application/ld\+json\"[^>]*>(.*?)</script>', h, re.S)
print('블록 수:', len(blocks))
for b in blocks:
    d = json.loads(b)
    items = d if isinstance(d, list) else [d]
    for x in items:
        print(' ', x['@type'], '|', list(x.keys())[:6])
        assert 'aggregateRating' not in x, 'aggregateRating 금지 위반'
        assert 'ratingValue' not in json.dumps(x), 'ratingValue 금지 위반'
print('평점 필드 없음 확인')
"
curl -s http://localhost:3410/ko | grep -c 'application/ld+json'
```
기대: 상세에 BreadcrumbList·SoftwareSourceCode 2개, 홈에 1개, 평점 필드 0건.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/jsonld.ts 'apps/web/app/[locale]/skills/[slug]/page.tsx' 'apps/web/app/[locale]/page.tsx'
git commit -m "feat(web): JSON-LD — BreadcrumbList·SoftwareSourceCode·WebSite (평점 필드 없음)"
```

---

### Task 4: 배포 + 프로덕션 검증 + GSC 재제출 안내

- [ ] **Step 1: master 머지·push** (사용자 승인 후)

```bash
git checkout master && git merge --no-ff m4-search -m "Merge branch 'm4-search': 검색 노출 — 코너 페이지·제목 재작성·JSON-LD" && npm test -w pipeline && git push
```

- [ ] **Step 2: 프로덕션 검증**

```bash
curl -s "https://skillmart.dev/ko/skills?category=docs-office" | grep -oE '<title>[^<]*</title>|<link rel="canonical"[^>]*>'
curl -s https://skillmart.dev/sitemap.xml | grep -c 'category='
curl -s https://skillmart.dev/ko/skills/skill-creator | grep -c 'application/ld+json'
```

- [ ] **Step 3: 사용자 동행 안내** — GSC에서 사이트맵 재제출(코너 36개 신규 URL 발견 유도), 리치 결과 테스트로 JSON-LD 확인
  - https://search.google.com/search-console/sitemaps → 기존 사이트맵 행의 ⋮ → 다시 가져오기
  - https://search.google.com/test/rich-results 에 스킬 URL 입력해 BreadcrumbList 인식 확인

---

## Self-Review 결과

1. **스펙 커버리지**: 코너 노출(T1)·제목 설명 재작성(T1 목록·T2 홈/상세/안내)·JSON-LD(T3)·배포 검증(T4). 외부 링크·네이버는 사용자 몫으로 분리(코드 아님).
2. **플레이스홀더 스캔**: 없음.
3. **타입 일관성**: `first()`는 목록 페이지에 이미 정의된 헬퍼를 generateMetadata에서 재사용(같은 파일 내). `pageAlternates(locale, path)`에 쿼리 문자열을 넘겨도 문자열 결합이라 안전. `jsonLd`/`breadcrumb`/`softwareSourceCode`/`webSite` 시그니처가 T3 정의 = 사용처 일치. `skill.license`는 `SkillDetail`의 `string | null`과 맞다.
