# 클로드스킬마트 M2 — 반응형 웹 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase의 실데이터(스킬 100건·3개국어 번역)를 보여주는 반응형 웹 — 홈·목록·상세·검색, /ko /vi /en 라우팅, 클로드 감성 UI — 을 만들어 브라우저에서 확인한다.

**Architecture:** 모노레포에 `apps/web`(Next.js 15 App Router) 워크스페이스 추가. 서버 컴포넌트가 Supabase(anon 키+RLS)를 직접 읽고 ISR(1시간)로 캐시. i18n은 next-intl(/ko /vi /en), 콘텐츠는 `skill_translations`에서 로케일 조회 + en 폴백. UI 단위 테스트는 없음(스펙 16: 웹은 빌드+스모크가 게이트) — 태스크별 게이트는 `typecheck + next build`, 최종 게이트는 Task 9의 브라우저 E2E 스모크.

**Tech Stack:** Next.js 15(App Router, TS), Tailwind CSS v4, next-intl v4, @supabase/supabase-js, react-markdown, next/font(Google).

**디자인 방향 (frontend-design 스킬 반영):** 스펙이 명시한 클로드 감성(크림·테라코타·세리프)을 따르되, 차별화 축: ①한국어 세리프 디스플레이 Gowun Batang × Source Serif 4, 본문 IBM Plex Sans(+KR)·모노 IBM Plex Mono(베트남어 커버) ②시그니처 = 상세페이지 **"영수증" 설치 블록**(마트 은유: 점선 절취선+모노 타이포+복사 버튼) ③마트 어휘("코너", "매대") ④좁은 사이드창(400~600px) 우선 단일 컬럼. 모션은 카드 hover 리프트와 복사 성공 상태 두 곳만, reduced-motion 존중.

## Global Constraints

- 로케일 `ko | vi | en`, 기본 `ko`. 번역 폴백: 요청 로케일 → `en` (스펙 8)
- `status='visible'` 스킬만 노출 (모든 쿼리에 필터)
- 목록 PAGE_SIZE = 20, 정렬 `rank`(rank_score desc, 기본)|`new`(created_at desc)
- ISR: 모든 페이지 `export const revalidate = 3600`
- 카테고리 12 slug 고정(M1과 동일): `docs-office, dev-coding, design-ui, marketing-seo, content-writing, image-video, data-analytics, automation-workflow, web-api, security-review, education, utility`
- 디자인 토큰(라이트/다크 = prefers-color-scheme):
  라이트 `--bg #FAF9F5, --surface #F1EEE7, --line #E3DFD3, --ink #33302A, --ink-soft #6E6858, --accent #C15F3C, --accent-ink #FFFFFF`
  다크 `--bg #262624, --surface #30302E, --line #3E3D3A, --ink #EDEAE3, --ink-soft #A8A396, --accent #D97757, --accent-ink #262624`
- 반응형: 375px 단일 컬럼 기준(사이드창 시나리오), `sm:`(640px+) 2컬럼 카드, `lg:` 최대폭 `max-w-5xl`
- 푸터에 3개 언어 비공식 고지 (스펙 9)
- env(`apps/web/.env.local`): `NEXT_PUBLIC_SUPABASE_URL=https://cbyuzwxamjdzxhltcjcl.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YXqfsIXQnInU4mynaiHmZw_sq21JODk` (publishable 키는 공개 설계 — 커밋 금지지만 노출 무해)
- 라이브러리 API 드리프트 허용: next-intl/Tailwind v4의 세부 API가 설치 버전과 다르면 **공식 패턴으로 최소 수정**하고 리포트에 기록 (계획 코드가 1차 기준)
- 커밋은 태스크마다 1회 이상. M3로 이월: 트렌딩 섹션, 컬렉션, sitemap/SEO 폴리시, RLS visible 필터

---

### Task 1: apps/web 스캐폴드

**Files:**
- Modify: `package.json` (루트 — workspaces에 "apps/web" 추가)
- Modify: `.gitignore` (Next 산출물 추가)
- Create: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.ts`, `apps/web/postcss.config.mjs`, `apps/web/.env.local`
- Create: `apps/web/app/layout.tsx`, `apps/web/app/page.tsx` (임시 부팅 확인용 — Task 2에서 삭제)

**Interfaces:**
- Consumes: 없음
- Produces: `npm run --workspace web build|dev|typecheck` 동작하는 Next.js 앱 골격. 이후 태스크 전부 이 위에 쌓는다

- [ ] **Step 1: 루트 수정**

`package.json`의 workspaces를:
```json
{
  "name": "skillmart",
  "private": true,
  "workspaces": ["pipeline", "apps/web"]
}
```

`.gitignore`에 아래 3줄 추가:
```
.next/
next-env.d.ts
.env*.local
```

- [ ] **Step 2: apps/web 파일 작성**

`apps/web/package.json`:
```json
{
  "name": "web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  }
}
```

`apps/web/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`apps/web/next.config.ts` (next-intl 플러그인은 Task 2에서 추가):
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

`apps/web/postcss.config.mjs`:
```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

`apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://cbyuzwxamjdzxhltcjcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YXqfsIXQnInU4mynaiHmZw_sq21JODk
```

`apps/web/app/layout.tsx` (임시):
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

`apps/web/app/page.tsx` (임시):
```tsx
export default function Page() {
  return <p>클로드스킬마트 — 준비 중</p>;
}
```

- [ ] **Step 3: 의존성 설치**

```bash
cd "/Users/isaac/Downloads/클로드스킬마트"
npm install --workspace web next@^15 react@^19 react-dom@^19 next-intl@^4 @supabase/supabase-js@^2 react-markdown@^10
npm install --workspace web -D typescript @types/react @types/react-dom @types/node tailwindcss@^4 @tailwindcss/postcss@^4
```
Expected: 오류 없이 설치

- [ ] **Step 4: 빌드 게이트**

Run: `npm run --workspace web build`
Expected: `✓ Compiled successfully`, 라우트 `/` 출력. (next-env.d.ts가 자동 생성됨)

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat(web): Next.js 앱 스캐폴드 (Tailwind v4, 워크스페이스 등록)"
```

---

### Task 2: i18n — /ko /vi /en 라우팅과 전체 UI 문자열

**Files:**
- Create: `apps/web/i18n/routing.ts`, `apps/web/i18n/request.ts`, `apps/web/i18n/navigation.ts`, `apps/web/middleware.ts`
- Create: `apps/web/messages/ko.json`, `apps/web/messages/vi.json`, `apps/web/messages/en.json`
- Create: `apps/web/app/[locale]/layout.tsx`, `apps/web/app/[locale]/page.tsx` (임시 — Task 5에서 교체)
- Modify: `apps/web/next.config.ts` (플러그인)
- Delete: `apps/web/app/layout.tsx`, `apps/web/app/page.tsx` (Task 1 임시 파일)

**Interfaces:**
- Consumes: Task 1 골격
- Produces: `routing`(locales/defaultLocale), `Link/redirect/usePathname`(i18n/navigation), 메시지 키 체계(brand, tagline, nav.skills, home.*, list.*, detail.*, difficulty.*, categories.{slug}, footer.*, notFound.*) — Task 3~8의 모든 화면이 `useTranslations`/`getTranslations`로 이 키를 쓴다

- [ ] **Step 1: 라우팅·미들웨어·설정**

`apps/web/i18n/routing.ts`:
```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "vi", "en"],
  defaultLocale: "ko",
});
```

`apps/web/i18n/request.ts`:
```ts
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

`apps/web/i18n/navigation.ts`:
```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

`apps/web/middleware.ts`:
```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

`apps/web/next.config.ts` 교체:
```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 2: 메시지 3종 작성 (전문 그대로)**

`apps/web/messages/ko.json`:
```json
{
  "brand": "클로드스킬마트",
  "tagline": "Claude Code 스킬 안내소",
  "nav": { "skills": "스킬 둘러보기" },
  "home": {
    "heroTitle": "클로드 스킬, 골라 담으세요",
    "heroSubtitle": "AI가 매일 GitHub에서 발굴해 한국어로 풀어쓴 Claude Code 스킬 — 오늘 매대에 {count}개",
    "searchPlaceholder": "어떤 스킬을 찾으세요? (예: PPT, 코드 리뷰)",
    "searchButton": "검색",
    "corners": "코너별로 둘러보기",
    "top": "인기 스킬",
    "fresh": "새로 들어온 스킬",
    "viewAll": "전체 보기"
  },
  "list": {
    "title": "스킬 목록",
    "resultCount": "{count}개 스킬",
    "all": "전체",
    "allLevels": "모든 난이도",
    "sortRank": "인기순",
    "sortNew": "최신순",
    "empty": "조건에 맞는 스킬이 아직 없어요. 검색어를 바꾸거나 코너를 넓혀보세요.",
    "prev": "이전",
    "next": "다음"
  },
  "detail": {
    "aiReview": "AI 한줄평",
    "install": "설치 가이드",
    "installCommand": "설치 명령",
    "copy": "복사",
    "copied": "복사됨 ✓",
    "source": "GitHub에서 원본 보기",
    "license": "라이선스",
    "updated": "마지막 업데이트",
    "official": "공식",
    "back": "목록으로",
    "score": "AI 점수"
  },
  "difficulty": { "beginner": "입문", "intermediate": "중급", "advanced": "고급" },
  "categories": {
    "docs-office": "문서·오피스",
    "dev-coding": "개발·코딩",
    "design-ui": "디자인·UI",
    "marketing-seo": "마케팅·SEO",
    "content-writing": "콘텐츠·글쓰기",
    "image-video": "이미지·영상",
    "data-analytics": "데이터·분석",
    "automation-workflow": "자동화·워크플로",
    "web-api": "웹·API 연동",
    "security-review": "보안·리뷰",
    "education": "교육·학습",
    "utility": "유틸리티"
  },
  "footer": {
    "disclaimer": "클로드스킬마트는 비공식 서비스이며 Anthropic과 무관합니다.",
    "dataNote": "스킬 정보는 GitHub 공개 저장소에서 매일 자동 수집됩니다."
  },
  "notFound": {
    "title": "이 매대는 비어 있어요",
    "desc": "찾으시는 스킬이 없거나 내려갔습니다.",
    "back": "홈으로"
  }
}
```

`apps/web/messages/vi.json`:
```json
{
  "brand": "Claude Skill Mart",
  "tagline": "Chợ kỹ năng Claude Code",
  "nav": { "skills": "Khám phá skill" },
  "home": {
    "heroTitle": "Chọn skill Claude cho bạn",
    "heroSubtitle": "Skill Claude Code do AI khám phá trên GitHub mỗi ngày, giải thích bằng tiếng Việt — hôm nay có {count} skill trên kệ",
    "searchPlaceholder": "Bạn cần skill gì? (vd: PPT, review code)",
    "searchButton": "Tìm kiếm",
    "corners": "Xem theo quầy hàng",
    "top": "Skill phổ biến",
    "fresh": "Skill mới về",
    "viewAll": "Xem tất cả"
  },
  "list": {
    "title": "Danh sách skill",
    "resultCount": "{count} skill",
    "all": "Tất cả",
    "allLevels": "Mọi trình độ",
    "sortRank": "Phổ biến",
    "sortNew": "Mới nhất",
    "empty": "Chưa có skill nào phù hợp. Thử đổi từ khóa hoặc xem quầy hàng khác nhé.",
    "prev": "Trước",
    "next": "Sau"
  },
  "detail": {
    "aiReview": "Nhận xét của AI",
    "install": "Hướng dẫn cài đặt",
    "installCommand": "Lệnh cài đặt",
    "copy": "Sao chép",
    "copied": "Đã sao chép ✓",
    "source": "Xem mã nguồn trên GitHub",
    "license": "Giấy phép",
    "updated": "Cập nhật lần cuối",
    "official": "Chính thức",
    "back": "Về danh sách",
    "score": "Điểm AI"
  },
  "difficulty": { "beginner": "Nhập môn", "intermediate": "Trung cấp", "advanced": "Nâng cao" },
  "categories": {
    "docs-office": "Tài liệu · Văn phòng",
    "dev-coding": "Lập trình",
    "design-ui": "Thiết kế · UI",
    "marketing-seo": "Marketing · SEO",
    "content-writing": "Nội dung · Viết lách",
    "image-video": "Ảnh · Video",
    "data-analytics": "Dữ liệu · Phân tích",
    "automation-workflow": "Tự động hóa",
    "web-api": "Web · API",
    "security-review": "Bảo mật · Review",
    "education": "Giáo dục",
    "utility": "Tiện ích"
  },
  "footer": {
    "disclaimer": "Claude Skill Mart là dịch vụ không chính thức, không liên quan đến Anthropic.",
    "dataNote": "Dữ liệu skill được thu thập tự động mỗi ngày từ các kho GitHub công khai."
  },
  "notFound": {
    "title": "Quầy hàng này đang trống",
    "desc": "Skill bạn tìm không tồn tại hoặc đã bị gỡ.",
    "back": "Về trang chủ"
  }
}
```

`apps/web/messages/en.json`:
```json
{
  "brand": "Claude Skill Mart",
  "tagline": "The Claude Code skill market",
  "nav": { "skills": "Browse skills" },
  "home": {
    "heroTitle": "Pick your Claude skills",
    "heroSubtitle": "Claude Code skills discovered on GitHub daily by AI, explained in plain English — {count} on the shelves today",
    "searchPlaceholder": "What skill do you need? (e.g. PPT, code review)",
    "searchButton": "Search",
    "corners": "Browse by aisle",
    "top": "Popular skills",
    "fresh": "Fresh arrivals",
    "viewAll": "View all"
  },
  "list": {
    "title": "All skills",
    "resultCount": "{count} skills",
    "all": "All",
    "allLevels": "All levels",
    "sortRank": "Popular",
    "sortNew": "Newest",
    "empty": "No skills match yet. Try a different search or browse another aisle.",
    "prev": "Prev",
    "next": "Next"
  },
  "detail": {
    "aiReview": "AI's take",
    "install": "Install guide",
    "installCommand": "Install command",
    "copy": "Copy",
    "copied": "Copied ✓",
    "source": "View source on GitHub",
    "license": "License",
    "updated": "Last updated",
    "official": "Official",
    "back": "Back to list",
    "score": "AI score"
  },
  "difficulty": { "beginner": "Beginner", "intermediate": "Intermediate", "advanced": "Advanced" },
  "categories": {
    "docs-office": "Docs & Office",
    "dev-coding": "Dev & Coding",
    "design-ui": "Design & UI",
    "marketing-seo": "Marketing & SEO",
    "content-writing": "Content & Writing",
    "image-video": "Image & Video",
    "data-analytics": "Data & Analytics",
    "automation-workflow": "Automation",
    "web-api": "Web & API",
    "security-review": "Security & Review",
    "education": "Education",
    "utility": "Utilities"
  },
  "footer": {
    "disclaimer": "Claude Skill Mart is an unofficial service, not affiliated with Anthropic.",
    "dataNote": "Skill data is collected automatically every day from public GitHub repositories."
  },
  "notFound": {
    "title": "This shelf is empty",
    "desc": "The skill you're looking for doesn't exist or was taken down.",
    "back": "Back home"
  }
}
```

- [ ] **Step 3: 로케일 레이아웃 + 임시 홈, Task 1 임시 파일 삭제**

`apps/web/app/layout.tsx`와 `apps/web/app/page.tsx` 삭제.

`apps/web/app/[locale]/layout.tsx`:
```tsx
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

`apps/web/app/[locale]/page.tsx` (임시 — 메시지 연결 확인용):
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  return <h1>{t("heroTitle")}</h1>;
}
```

- [ ] **Step 4: 빌드 게이트**

Run: `npm run --workspace web build`
Expected: `/[locale]` 라우트가 ko/vi/en으로 정적 생성됨. 실패 시 next-intl v4 공식 패턴(App Router without i18n routing 문서 아님 — with i18n routing)으로 최소 수정 후 리포트에 기록

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat(web): next-intl 3개 언어 라우팅 + 전체 UI 문자열 (ko/vi/en)"
```

---

### Task 3: 디자인 시스템 — 토큰·폰트·헤더·푸터·카드

**Files:**
- Create: `apps/web/app/globals.css`, `apps/web/lib/fonts.ts`
- Create: `apps/web/components/Header.tsx`, `apps/web/components/LocaleSwitcher.tsx`, `apps/web/components/Footer.tsx`, `apps/web/components/SkillCard.tsx`, `apps/web/components/Chip.tsx`
- Modify: `apps/web/app/[locale]/layout.tsx` (globals+폰트+Header/Footer 적용)

**Interfaces:**
- Consumes: Task 2의 메시지 키, `Link`(i18n/navigation)
- Produces: Tailwind 시맨틱 토큰(`bg-bg, bg-surface, text-ink, text-ink-soft, text-accent, bg-accent, border-line, font-display, font-body, font-mono-plex`), `SkillCard({ skill, locale })`(Task 5·6이 사용 — skill은 Task 4의 `SkillListItem`), `Chip({ children, active? })`

- [ ] **Step 1: 토큰과 전역 스타일**

`apps/web/app/globals.css`:
```css
@import "tailwindcss";

:root {
  --bg: #faf9f5;
  --surface: #f1eee7;
  --line: #e3dfd3;
  --ink: #33302a;
  --ink-soft: #6e6858;
  --accent: #c15f3c;
  --accent-ink: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #262624;
    --surface: #30302e;
    --line: #3e3d3a;
    --ink: #edeae3;
    --ink-soft: #a8a396;
    --accent: #d97757;
    --accent-ink: #262624;
  }
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-line: var(--line);
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-accent: var(--accent);
  --color-accent-ink: var(--accent-ink);
  --font-display: var(--font-source-serif), var(--font-gowun), "Georgia", serif;
  --font-body: var(--font-plex), var(--font-plex-kr), "Apple SD Gothic Neo", sans-serif;
  --font-mono-plex: var(--font-plex-mono), ui-monospace, monospace;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
}

::selection {
  background: var(--accent);
  color: var(--accent-ink);
}

a,
button {
  outline-offset: 2px;
}
a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--accent);
}

/* 상세페이지 마크다운 (typography 플러그인 대신 수제 최소셋) */
.md h2 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; margin: 1.5em 0 0.5em; }
.md h3 { font-weight: 600; margin: 1.2em 0 0.4em; }
.md p { margin: 0.6em 0; line-height: 1.75; }
.md ul, .md ol { margin: 0.6em 0; padding-left: 1.4em; line-height: 1.7; }
.md ul { list-style: disc; }
.md ol { list-style: decimal; }
.md code { font-family: var(--font-mono-plex); font-size: 0.85em; background: var(--surface); border: 1px solid var(--line); border-radius: 4px; padding: 0.1em 0.35em; }
.md pre { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 0.8em 1em; overflow-x: auto; margin: 0.8em 0; }
.md pre code { background: none; border: none; padding: 0; }
.md a { color: var(--accent); text-decoration: underline; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
```

- [ ] **Step 2: 폰트**

`apps/web/lib/fonts.ts`:
```ts
import {
  Gowun_Batang,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_KR,
  Source_Serif_4,
} from "next/font/google";

export const gowun = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gowun",
});

export const sourceSerif = Source_Serif_4({
  subsets: ["latin", "vietnamese"],
  variable: "--font-source-serif",
});

export const plex = IBM_Plex_Sans({
  weight: ["400", "600"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-plex",
});

export const plexKr = IBM_Plex_Sans_KR({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-plex-kr",
});

export const plexMono = IBM_Plex_Mono({
  weight: ["400", "600"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-plex-mono",
});
```

- [ ] **Step 3: 공통 컴포넌트**

`apps/web/components/Chip.tsx`:
```tsx
export default function Chip({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
        active
          ? "border-accent bg-accent text-accent-ink"
          : "border-line bg-surface text-ink-soft"
      }`}
    >
      {children}
    </span>
  );
}
```

`apps/web/components/SkillCard.tsx`:
```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SkillListItem } from "@/lib/db";
import Chip from "./Chip";

export default function SkillCard({ skill }: { skill: SkillListItem }) {
  const t = useTranslations();
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group block rounded-xl border border-line bg-surface p-4 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="truncate font-display text-lg font-bold group-hover:text-accent">
          {skill.name}
        </h3>
        {skill.is_official && (
          <span className="shrink-0 text-xs font-semibold text-accent">
            {t("detail.official")}
          </span>
        )}
      </div>
      <p className="mb-3 line-clamp-2 min-h-10 text-sm leading-relaxed text-ink-soft">
        {skill.one_liner}
      </p>
      <div className="flex items-center gap-2 text-xs text-ink-soft">
        <Chip>{t(`categories.${skill.category}`)}</Chip>
        <span>★ {skill.stars.toLocaleString()}</span>
        <span className="ml-auto">
          {t("detail.score")} {skill.ai_score}/10
        </span>
      </div>
    </Link>
  );
}
```

`apps/web/components/LocaleSwitcher.tsx`:
```tsx
"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { ko: "한국어", vi: "Tiếng Việt", en: "English" };

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 text-xs">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          className={`rounded-full px-2 py-1 ${
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

`apps/web/components/Header.tsx`:
```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";

export default function Header() {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="font-display text-lg font-bold">
          {t("brand")}
        </Link>
        <Link href="/skills" className="text-sm text-ink-soft hover:text-ink">
          {t("nav.skills")}
        </Link>
        <div className="ml-auto">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
```

`apps/web/components/Footer.tsx`:
```tsx
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-16 border-t border-line py-8 text-center text-xs leading-relaxed text-ink-soft">
      <div className="mx-auto max-w-5xl px-4">
        <p>{t("disclaimer")}</p>
        <p>{t("dataNote")}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: 레이아웃에 적용**

`apps/web/app/[locale]/layout.tsx` 전체 교체:
```tsx
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { routing } from "@/i18n/routing";
import { gowun, plex, plexKr, plexMono, sourceSerif } from "@/lib/fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const fontVars = `${gowun.variable} ${sourceSerif.variable} ${plex.variable} ${plexKr.variable} ${plexMono.variable}`;
  return (
    <html lang={locale} className={fontVars}>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

참고: `SkillListItem` 임포트는 Task 4에서 생기므로, 이 태스크의 빌드 게이트를 위해 `apps/web/lib/db.ts`에 임시 타입 스텁을 만들지 **말고**, SkillCard 임포트를 잠시 `type SkillListItem = any`로 두지도 말 것 — 대신 Task 3에서는 SkillCard를 **작성만 하고 어느 페이지에서도 임포트하지 않는다**(임시 홈은 Task 2 상태 유지). Next는 미사용 컴포넌트의 타입 오류도 typecheck에서 잡으므로, `lib/db.ts`에 **타입 전용 파일을 먼저** 만든다:

`apps/web/lib/db.ts` (Task 3 시점 — 타입만, 함수는 Task 4에서 추가):
```ts
export interface SkillListItem {
  id: string;
  slug: string;
  category: string;
  difficulty: string | null;
  ai_score: number | null;
  stars: number;
  is_official: boolean;
  created_at: string;
  rank_score: number;
  name: string;
  one_liner: string;
}
```

- [ ] **Step 5: 게이트 + 커밋**

Run: `npm run --workspace web typecheck && npm run --workspace web build`
Expected: 통과

```bash
git add -A
git commit -m "feat(web): 디자인 시스템 — 토큰·폰트·헤더·푸터·스킬 카드"
```

---

### Task 4: Supabase 읽기 데이터 계층

**Files:**
- Create: `apps/web/lib/categories.ts`
- Modify: `apps/web/lib/db.ts` (타입에 함수 추가)

**Interfaces:**
- Consumes: Task 2의 로케일, M1 스키마(skills, skill_translations)
- Produces (Task 5~7이 사용):
  - `CATEGORIES: readonly string[]` (12 slug), `DIFFICULTIES = ["beginner","intermediate","advanced"]`
  - `PAGE_SIZE = 20`
  - `getVisibleCount(): Promise<number>`
  - `getHomeSkills(locale): Promise<{ top: SkillListItem[]; fresh: SkillListItem[] }>` (각 8개)
  - `searchSkills(opts: { locale: string; q?: string; category?: string; difficulty?: string; sort: "rank" | "new"; page: number }): Promise<{ items: SkillListItem[]; total: number }>`
  - `getSkillBySlug(slug, locale): Promise<SkillDetail | null>` — `SkillDetail`은 skills 전체 컬럼 + 로케일 해석된 `name, one_liner, description_md, install_guide_md, ai_review` (로케일→en 폴백)

- [ ] **Step 1: 구현**

`apps/web/lib/categories.ts`:
```ts
export const CATEGORIES = [
  "docs-office", "dev-coding", "design-ui", "marketing-seo",
  "content-writing", "image-video", "data-analytics", "automation-workflow",
  "web-api", "security-review", "education", "utility",
] as const;

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
```

`apps/web/lib/db.ts` 전체 교체:
```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

export const PAGE_SIZE = 20;

export interface SkillListItem {
  id: string;
  slug: string;
  category: string;
  difficulty: string | null;
  ai_score: number | null;
  stars: number;
  is_official: boolean;
  created_at: string;
  rank_score: number;
  name: string;
  one_liner: string;
}

export interface SkillDetail extends SkillListItem {
  forks: number;
  last_commit_at: string | null;
  source_url: string;
  license: string | null;
  install_command: string | null;
  description_md: string;
  install_guide_md: string;
  ai_review: string | null;
}

const LIST_COLS =
  "id, slug, category, difficulty, ai_score, stars, is_official, created_at, rank_score";

interface TranslationRow {
  locale: string;
  name: string;
  one_liner: string;
  description_md?: string;
  install_guide_md?: string;
}

function pickTranslation(rows: TranslationRow[], locale: string): TranslationRow | null {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "en") ?? rows[0] ?? null;
}

function toListItem(row: Record<string, unknown>, locale: string): SkillListItem | null {
  const tr = pickTranslation((row.skill_translations as TranslationRow[]) ?? [], locale);
  if (!tr) return null;
  const { skill_translations: _drop, ...rest } = row;
  return { ...(rest as Omit<SkillListItem, "name" | "one_liner">), name: tr.name, one_liner: tr.one_liner };
}

export async function getVisibleCount(): Promise<number> {
  const { count, error } = await db
    .from("skills")
    .select("id", { count: "exact", head: true })
    .eq("status", "visible");
  if (error) throw new Error(`skills count 실패: ${error.message}`);
  return count ?? 0;
}

export async function getHomeSkills(
  locale: string,
): Promise<{ top: SkillListItem[]; fresh: SkillListItem[] }> {
  const base = () =>
    db
      .from("skills")
      .select(`${LIST_COLS}, skill_translations(locale, name, one_liner)`)
      .eq("status", "visible");
  const [top, fresh] = await Promise.all([
    base().order("rank_score", { ascending: false }).limit(8),
    base().order("created_at", { ascending: false }).limit(8),
  ]);
  if (top.error) throw new Error(`top skills 조회 실패: ${top.error.message}`);
  if (fresh.error) throw new Error(`fresh skills 조회 실패: ${fresh.error.message}`);
  const flat = (rows: Record<string, unknown>[]) =>
    rows.map((r) => toListItem(r, locale)).filter((x): x is SkillListItem => x !== null);
  return { top: flat(top.data), fresh: flat(fresh.data) };
}

/* PostgREST or() 문법의 구분자와 충돌하는 문자를 검색어에서 제거하고 like 와일드카드를 이스케이프 */
function sanitizeQuery(q: string): string {
  return q.replace(/[,()]/g, " ").replace(/[%_]/g, (m) => `\\${m}`).trim();
}

export async function searchSkills(opts: {
  locale: string;
  q?: string;
  category?: string;
  difficulty?: string;
  sort: "rank" | "new";
  page: number;
}): Promise<{ items: SkillListItem[]; total: number }> {
  let query = db
    .from("skills")
    .select(`${LIST_COLS}, skill_translations!inner(locale, name, one_liner)`, {
      count: "exact",
    })
    .eq("status", "visible")
    .eq("skill_translations.locale", opts.locale);
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.difficulty) query = query.eq("difficulty", opts.difficulty);
  if (opts.q && opts.q.trim()) {
    const q = sanitizeQuery(opts.q);
    if (q) {
      query = query.or(`name.ilike.%${q}%,one_liner.ilike.%${q}%,description_md.ilike.%${q}%`, {
        referencedTable: "skill_translations",
      });
    }
  }
  query =
    opts.sort === "new"
      ? query.order("created_at", { ascending: false })
      : query.order("rank_score", { ascending: false });
  const from = (opts.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`skills 검색 실패: ${error.message}`);
  const items = (data as Record<string, unknown>[])
    .map((r) => toListItem(r, opts.locale))
    .filter((x): x is SkillListItem => x !== null);
  return { items, total: count ?? 0 };
}

export async function getSkillBySlug(slug: string, locale: string): Promise<SkillDetail | null> {
  const { data, error } = await db
    .from("skills")
    .select(
      `${LIST_COLS}, forks, last_commit_at, source_url, license, install_command,
       ai_review_ko, ai_review_vi, ai_review_en,
       skill_translations(locale, name, one_liner, description_md, install_guide_md)`,
    )
    .eq("status", "visible")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`skill 상세 조회 실패: ${error.message}`);
  if (!data) return null;
  const tr = pickTranslation((data.skill_translations as TranslationRow[]) ?? [], locale);
  if (!tr) return null;
  const reviews: Record<string, string | null> = {
    ko: data.ai_review_ko,
    vi: data.ai_review_vi,
    en: data.ai_review_en,
  };
  const { skill_translations: _t, ai_review_ko: _k, ai_review_vi: _v, ai_review_en: _e, ...rest } = data;
  return {
    ...(rest as Omit<SkillDetail, "name" | "one_liner" | "description_md" | "install_guide_md" | "ai_review">),
    name: tr.name,
    one_liner: tr.one_liner,
    description_md: tr.description_md ?? "",
    install_guide_md: tr.install_guide_md ?? "",
    ai_review: reviews[locale] ?? reviews.en ?? null,
  };
}
```

- [ ] **Step 2: 게이트 + 커밋**

Run: `npm run --workspace web typecheck && npm run --workspace web build`
Expected: 통과 (참고: `referencedTable` 옵션이 설치된 supabase-js 버전에서 다르게 불리면 — 구버전은 `foreignTable` — 해당 이름으로 바꾸고 리포트에 기록)

```bash
git add -A
git commit -m "feat(web): Supabase 읽기 계층 (홈·검색·상세, 로케일 폴백)"
```

---

### Task 5: 홈 페이지

**Files:**
- Modify: `apps/web/app/[locale]/page.tsx` (임시 → 실제)
- Create: `apps/web/components/SearchBar.tsx`

**Interfaces:**
- Consumes: `getHomeSkills`, `getVisibleCount`, `SkillCard`, `Chip`, 메시지 `home.*`, `categories.*`
- Produces: `/[locale]` 홈 — hero(제목·부제·검색), 코너(카테고리 12 링크), 인기 8, 신규 8

- [ ] **Step 1: 구현**

`apps/web/components/SearchBar.tsx`:
```tsx
import { useTranslations } from "next-intl";

export default function SearchBar({ locale, defaultValue = "" }: { locale: string; defaultValue?: string }) {
  const t = useTranslations("home");
  return (
    <form action={`/${locale}/skills`} method="GET" className="flex gap-2" role="search">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm placeholder:text-ink-soft"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink"
      >
        {t("searchButton")}
      </button>
    </form>
  );
}
```

`apps/web/app/[locale]/page.tsx` 전체 교체:
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import Chip from "@/components/Chip";
import SearchBar from "@/components/SearchBar";
import SkillCard from "@/components/SkillCard";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/categories";
import { getHomeSkills, getVisibleCount } from "@/lib/db";

export const revalidate = 3600;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [count, { top, fresh }] = await Promise.all([getVisibleCount(), getHomeSkills(locale)]);

  return (
    <div className="py-10">
      <section className="mb-12 text-center">
        <h1 className="mb-3 font-display text-3xl font-bold sm:text-4xl">
          {t("home.heroTitle")}
        </h1>
        <p className="mb-6 text-sm text-ink-soft">{t("home.heroSubtitle", { count })}</p>
        <div className="mx-auto max-w-xl">
          <SearchBar locale={locale} />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl font-bold">{t("home.corners")}</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/skills?category=${c}`}>
              <Chip>{t(`categories.${c}`)}</Chip>
            </Link>
          ))}
        </div>
      </section>

      <HomeSection title={t("home.top")} viewAll={t("home.viewAll")} href="/skills?sort=rank" skills={top} />
      <HomeSection title={t("home.fresh")} viewAll={t("home.viewAll")} href="/skills?sort=new" skills={fresh} />
    </div>
  );
}

function HomeSection({
  title,
  viewAll,
  href,
  skills,
}: {
  title: string;
  viewAll: string;
  href: string;
  skills: Awaited<ReturnType<typeof getHomeSkills>>["top"];
}) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <Link href={href} className="text-sm text-accent">
          {viewAll} →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {skills.map((s) => (
          <SkillCard key={s.id} skill={s} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 게이트 + 커밋**

Run: `npm run --workspace web typecheck && npm run --workspace web build`
Expected: 통과 (빌드 중 Supabase에 실제 쿼리 발생 — .env.local 필요)

```bash
git add -A
git commit -m "feat(web): 홈 — 히어로·검색·코너·인기·신규"
```

---

### Task 6: 목록 페이지 (검색·필터·정렬·페이지네이션)

**Files:**
- Create: `apps/web/app/[locale]/skills/page.tsx`

**Interfaces:**
- Consumes: `searchSkills`, `PAGE_SIZE`, `CATEGORIES`, `DIFFICULTIES`, `SkillCard`, `Chip`, `SearchBar`, 메시지 `list.*`
- Produces: `/[locale]/skills?q=&category=&difficulty=&sort=&page=` — 서버 컴포넌트, 필터는 전부 링크(클라이언트 상태 없음)

- [ ] **Step 1: 구현**

`apps/web/app/[locale]/skills/page.tsx`:
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import Chip from "@/components/Chip";
import SearchBar from "@/components/SearchBar";
import SkillCard from "@/components/SkillCard";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, DIFFICULTIES } from "@/lib/categories";
import { PAGE_SIZE, searchSkills } from "@/lib/db";

export const revalidate = 3600;

type Search = { q?: string; category?: string; difficulty?: string; sort?: string; page?: string };

function qs(base: Search, patch: Partial<Search>): string {
  const merged: Record<string, string | undefined> = { ...base, ...patch };
  const params = new URLSearchParams();
  for (const key of ["q", "category", "difficulty", "sort", "page"]) {
    const v = merged[key];
    if (v) params.set(key, v);
  }
  const s = params.toString();
  return s ? `/skills?${s}` : "/skills";
}

export default async function SkillsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations();
  const sort = sp.sort === "new" ? "new" : "rank";
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total } = await searchSkills({
    locale,
    q: sp.q,
    category: sp.category,
    difficulty: sp.difficulty,
    sort,
    page,
  });
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base: Search = { ...sp, sort, page: undefined };

  return (
    <div className="py-8">
      <h1 className="mb-4 font-display text-2xl font-bold">{t("list.title")}</h1>
      <div className="mb-5 max-w-xl">
        <SearchBar locale={locale} defaultValue={sp.q ?? ""} />
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <Link href={qs(base, { category: undefined })}>
          <Chip active={!sp.category}>{t("list.all")}</Chip>
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={qs(base, { category: c })}>
            <Chip active={sp.category === c}>{t(`categories.${c}`)}</Chip>
          </Link>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
        <Link href={qs(base, { difficulty: undefined })}>
          <Chip active={!sp.difficulty}>{t("list.allLevels")}</Chip>
        </Link>
        {DIFFICULTIES.map((d) => (
          <Link key={d} href={qs(base, { difficulty: d })}>
            <Chip active={sp.difficulty === d}>{t(`difficulty.${d}`)}</Chip>
          </Link>
        ))}
        <span className="mx-2 text-line">|</span>
        <Link href={qs(base, { sort: "rank" })}>
          <Chip active={sort === "rank"}>{t("list.sortRank")}</Chip>
        </Link>
        <Link href={qs(base, { sort: "new" })}>
          <Chip active={sort === "new"}>{t("list.sortNew")}</Chip>
        </Link>
        <span className="ml-auto text-ink-soft">{t("list.resultCount", { count: total })}</span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
          {t("list.empty")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </div>
      )}

      {lastPage > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
          {page > 1 && (
            <Link className="text-accent" href={qs(base, { page: String(page - 1) })}>
              ← {t("list.prev")}
            </Link>
          )}
          <span className="text-ink-soft">
            {page} / {lastPage}
          </span>
          {page < lastPage && (
            <Link className="text-accent" href={qs(base, { page: String(page + 1) })}>
              {t("list.next")} →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 게이트 + 커밋**

Run: `npm run --workspace web typecheck && npm run --workspace web build`
Expected: 통과

```bash
git add -A
git commit -m "feat(web): 스킬 목록 — 검색·카테고리·난이도 필터·정렬·페이지네이션"
```

---

### Task 7: 상세 페이지 + 영수증 설치 블록

**Files:**
- Create: `apps/web/app/[locale]/skills/[slug]/page.tsx`
- Create: `apps/web/components/CopyButton.tsx`, `apps/web/components/InstallReceipt.tsx`

**Interfaces:**
- Consumes: `getSkillBySlug`, `Chip`, 메시지 `detail.*`
- Produces: `/[locale]/skills/[slug]` — generateMetadata(hreflang 포함), 없는 slug는 notFound()

- [ ] **Step 1: 클라이언트 복사 버튼**

`apps/web/components/CopyButton.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function CopyButton({ text }: { text: string }) {
  const t = useTranslations("detail");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        copied ? "bg-surface text-ink-soft" : "bg-accent text-accent-ink"
      }`}
    >
      {copied ? t("copied") : t("copy")}
    </button>
  );
}
```

- [ ] **Step 2: 시그니처 — 영수증 설치 블록**

`apps/web/components/InstallReceipt.tsx`:
```tsx
import Markdown from "react-markdown";
import { useTranslations } from "next-intl";
import CopyButton from "./CopyButton";

export default function InstallReceipt({
  command,
  guideMd,
}: {
  command: string | null;
  guideMd: string;
}) {
  const t = useTranslations("detail");
  return (
    <section className="my-8 border-y-2 border-dashed border-line bg-surface px-5 py-6 font-mono-plex text-sm">
      <h2 className="mb-4 text-center font-display text-lg font-bold tracking-widest">
        · · · {t("install")} · · ·
      </h2>
      {command && (
        <div className="mb-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-ink-soft">
            {t("installCommand")}
          </p>
          <div className="flex items-start gap-2 rounded-lg border border-line bg-bg p-3">
            <code className="min-w-0 flex-1 break-all text-xs leading-relaxed">{command}</code>
            <CopyButton text={command} />
          </div>
        </div>
      )}
      <div className="md font-body">
        <Markdown>{guideMd}</Markdown>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: 상세 페이지**

`apps/web/app/[locale]/skills/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Markdown from "react-markdown";
import Chip from "@/components/Chip";
import InstallReceipt from "@/components/InstallReceipt";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getSkillBySlug } from "@/lib/db";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const skill = await getSkillBySlug(slug, locale);
  if (!skill) return {};
  return {
    title: `${skill.name} — 클로드스킬마트`,
    description: skill.one_liner,
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/skills/${slug}`])),
    },
  };
}

export default async function SkillDetail({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const skill = await getSkillBySlug(slug, locale);
  if (!skill) notFound();

  const updated = skill.last_commit_at
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(skill.last_commit_at))
    : null;

  return (
    <article className="mx-auto max-w-2xl py-8">
      <Link href="/skills" className="text-sm text-ink-soft hover:text-ink">
        ← {t("detail.back")}
      </Link>

      <header className="mt-4 mb-6">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold">{skill.name}</h1>
          {skill.is_official && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-ink">
              {t("detail.official")}
            </span>
          )}
        </div>
        <p className="mb-3 text-ink-soft">{skill.one_liner}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <Chip>{t(`categories.${skill.category}`)}</Chip>
          {skill.difficulty && <Chip>{t(`difficulty.${skill.difficulty}`)}</Chip>}
          <span>★ {skill.stars.toLocaleString()}</span>
          <span>
            {t("detail.score")} {skill.ai_score}/10
          </span>
          {updated && (
            <span>
              {t("detail.updated")}: {updated}
            </span>
          )}
        </div>
      </header>

      {skill.ai_review && (
        <aside className="mb-6 rounded-r-xl border-l-4 border-accent bg-surface px-4 py-3 text-sm leading-relaxed">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            {t("detail.aiReview")}
          </p>
          {skill.ai_review}
        </aside>
      )}

      <div className="md text-[15px]">
        <Markdown>{skill.description_md}</Markdown>
      </div>

      <InstallReceipt command={skill.install_command} guideMd={skill.install_guide_md} />

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <a
          href={skill.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-accent px-5 py-3 font-semibold text-accent-ink"
        >
          {t("detail.source")} ↗
        </a>
        {skill.license && (
          <span className="text-ink-soft">
            {t("detail.license")}: {skill.license}
          </span>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 4: 게이트 + 커밋**

Run: `npm run --workspace web typecheck && npm run --workspace web build`
Expected: 통과

```bash
git add -A
git commit -m "feat(web): 스킬 상세 — 해설·AI 한줄평·영수증 설치 블록·복사"
```

---

### Task 8: 404·로딩·마무리

**Files:**
- Create: `apps/web/app/[locale]/not-found.tsx`, `apps/web/app/[locale]/loading.tsx`

**Interfaces:**
- Consumes: 메시지 `notFound.*`
- Produces: 없는 slug/경로의 매대 비었어요 화면, 라우트 전환 스켈레톤

- [ ] **Step 1: 구현**

`apps/web/app/[locale]/not-found.tsx`:
```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="py-24 text-center">
      <h1 className="mb-2 font-display text-2xl font-bold">{t("title")}</h1>
      <p className="mb-6 text-sm text-ink-soft">{t("desc")}</p>
      <Link href="/" className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink">
        {t("back")}
      </Link>
    </div>
  );
}
```

`apps/web/app/[locale]/loading.tsx`:
```tsx
export default function Loading() {
  return (
    <div className="grid gap-3 py-10 sm:grid-cols-2" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl border border-line bg-surface" />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 최종 빌드 게이트 + 커밋**

Run: `npm run --workspace web typecheck && npm run --workspace web build`
Expected: 통과, 라우트 요약에 `/[locale]`, `/[locale]/skills`, `/[locale]/skills/[slug]` 표시

```bash
git add -A
git commit -m "feat(web): 404·로딩 상태"
```

---

### Task 9: E2E 브라우저 스모크 (컨트롤러 직접 수행)

**Files:**
- Create: `.claude/launch.json`

**Interfaces:**
- Consumes: Task 1~8 전부, 실DB
- Produces: 사용자에게 보여줄 스크린샷 + 스모크 판정. **M2 종료 기준**

- [ ] **Step 1: launch.json**

`.claude/launch.json`:
```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "web",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "--workspace", "web", "dev"],
      "port": 3000
    }
  ]
}
```

- [ ] **Step 2: 스모크 체크리스트 (브라우저 프리뷰로 수행)**

1. `/` → `/ko` 리다이렉트 확인
2. `/ko` 홈: 히어로 카운트 숫자, 코너 12개, 인기·신규 카드 각 8개, 콘솔 에러 0
3. `/vi`, `/en` 홈: 언어 스위처로 전환, 문자열·데이터 언어 일치(특히 vi 발음기호 렌더)
4. `/ko/skills?q=PPT`: 검색 결과 존재, 카테고리 칩 필터 동작, 페이지네이션(전체 목록 100건 → 5페이지)
5. 상세 페이지: 해설 마크다운 렌더, AI 한줄평, 영수증 블록, 복사 버튼 클릭 → "복사됨 ✓", GitHub 링크
6. 없는 slug `/ko/skills/no-such-skill` → 404 매대 화면
7. 뷰포트 375px(모바일 프리셋): 단일 컬럼, 가로 스크롤 없음 / 다크모드(colorScheme dark) 확인
8. 스크린샷(홈 라이트·다크, 상세 영수증)을 사용자에게 전송

- [ ] **Step 3: 발견된 문제 수정 후 커밋**

```bash
git add -A
git commit -m "chore(web): E2E 스모크 반영 (.claude/launch.json)"
```

---

## Self-Review 결과

- 스펙 커버리지: M2 범위(스펙 12-M2 "웹 코어: 홈·목록·상세·검색, 3개 언어 라우팅, Claude 감성 UI") 전부 매핑. 홈의 트렌딩·컬렉션 섹션은 스펙 마일스톤대로 M3(데이터가 그때 생김), 시작 가이드·마이페이지·평점·즐겨찾기·sitemap은 M4로 명시 이월
- 플레이스홀더: 없음 — 전 태스크 실코드. 라이브러리 버전 드리프트는 Global Constraints의 허용 규칙으로 처리
- 타입 일관성: `SkillListItem`(T3 타입 선행 → T4 함수 추가) 필드가 SkillCard 사용 필드와 일치, `SkillDetail` 필드가 상세 페이지 사용과 일치, `qs()` Search 키 5종이 searchSkills 인자와 일치함을 확인
