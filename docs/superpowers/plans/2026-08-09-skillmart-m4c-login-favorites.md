# M4-C 로그인 + 내 보관함 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Google 버튼 하나로 로그인하고, 스킬 카드·상세에서 ❤️로 담고, `/{locale}/favorites`에서 담은 스킬을 다시 찾을 수 있게 한다.

**Architecture:** 인증·즐겨찾기는 **전부 브라우저 측**에서 처리한다 — 기존 `@supabase/supabase-js`의 `createClient`를 브라우저 모듈로 하나 더 만들고(localStorage 세션 + PKCE `detectSessionInUrl` 기본값), RLS가 `auth.uid()`로 행을 가른다. 서버 쿠키·`@supabase/ssr`·미들웨어 합성이 전부 불필요하다: 페이지는 ISR(revalidate 3600)이라 사용자별 상태를 서버 렌더에 넣을 수 없고, 어차피 클라이언트에서 읽어야 한다. 한 페이지의 ❤️ 상태는 `FavoritesProvider`가 사용자 즐겨찾기 id 집합을 **한 번만** 불러 컨텍스트로 공유한다(카드 20개 = 쿼리 20번을 피한다).

**Tech Stack:** Supabase Auth(Google) + RLS, `@supabase/supabase-js`(이미 설치됨 — 신규 의존성 0), React Context, next-intl v4.

## Global Constraints

- **신규 의존성 금지** — `@supabase/ssr` 도입하지 않는다. 서버 컴포넌트에서 사용자를 알 필요가 없으므로(ISR 캐시라 알아도 못 쓴다) 브라우저 클라이언트만으로 충분하다
- `lib/db.ts`는 `server-only`다. 브라우저 클라이언트는 **별도 파일** `lib/supabase-browser.ts`에 두고 db.ts를 import하지 않는다
- RLS는 `user_favorites`에 **읽기·쓰기·삭제 모두 `auth.uid() = user_id`** 로 잠근다. anon 키가 클라이언트에 노출되어 있으므로 이 정책이 유일한 방어선이다 — Task 1에서 SQL로 직접 검증한다
- 마이그레이션은 저장소 관례에 따라 `supabase/migrations/0003_favorites.sql`로 **파일도 남기고** MCP `apply_migration`으로 적용한다(파일만 두면 원격 DB에 반영되지 않는다)
- `/{locale}/favorites`는 **`robots: { index: false }`** — 로그인 사용자별 페이지이고 크롤러에겐 빈 껍데기다. sitemap에도 넣지 않는다
- "N명이 담았어요" 카운트는 **이번 범위 제외** — 사용자 0명 상태에서 전 스킬에 "0명"이 붙으면 없는 것보다 나빠 보인다. 사용자가 쌓인 뒤 트리거+컬럼으로 추가
- 새 UI 문자열은 ko/vi/en 3개 파일 모두. 키 누락 시 next-intl 런타임 에러
- Google 자격증명(클라이언트 ID·시크릿) 발급과 Supabase 대시보드 입력은 **사용자만 할 수 있다**(Task 5). 그 전까지 로그인 버튼은 provider 미설정 에러를 낸다 — Task 4 검증은 비로그인 상태 렌더링과 RLS까지만 다룬다
- 커밋은 한국어 `feat(web):` 프리픽스, 브랜치 `m4-login`
- 로컬 검증 빌드는 `rm -rf apps/web/.next` 후

---

### Task 1: user_favorites 테이블 + RLS

**Files:**
- Create: `supabase/migrations/0003_favorites.sql`

**Interfaces:**
- Produces: `public.user_favorites(user_id uuid, skill_id uuid, created_at timestamptz)` — Task 3·4가 읽고 쓴다

- [x] **Step 1: 브랜치 + 마이그레이션 파일 작성**

```bash
cd /Users/isaac/Downloads/클로드스킬마트
git checkout -b m4-login
```

`supabase/migrations/0003_favorites.sql`:

```sql
create table user_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid not null references skills (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create index user_favorites_user_idx on user_favorites (user_id, created_at desc);

alter table user_favorites enable row level security;

-- anon 키가 브라우저에 노출되므로 이 세 정책이 유일한 방어선이다
create policy "own favorites read" on user_favorites for select
  using (auth.uid() = user_id);
create policy "own favorites insert" on user_favorites for insert
  with check (auth.uid() = user_id);
create policy "own favorites delete" on user_favorites for delete
  using (auth.uid() = user_id);
```

- [x] **Step 2: 원격 DB에 적용** — MCP `apply_migration` 호출 (project_id `cbyuzwxamjdzxhltcjcl`, name `favorites`, query는 Step 1 SQL 전문)

- [x] **Step 3: RLS 실검증** — MCP `execute_sql`로 익명 역할이 차단되는지 확인

```sql
-- 테스트 사용자 2명 + 즐겨찾기 2행을 service_role로 심는다
insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-a@example.com', now(), now()),
       ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-b@example.com', now(), now());
insert into user_favorites (user_id, skill_id)
select '11111111-1111-1111-1111-111111111111', id from skills where status='visible' order by slug limit 1;
insert into user_favorites (user_id, skill_id)
select '22222222-2222-2222-2222-222222222222', id from skills where status='visible' order by slug limit 1;

-- ① anon은 0행이어야
set local role anon;
select count(*) as anon_sees from user_favorites;
reset role;

-- ② 사용자 A는 자기 1행만 보여야
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select count(*) as a_sees from user_favorites;
-- ③ 남의 행 삭제 시도는 0행 영향이어야
with d as (delete from user_favorites where user_id='22222222-2222-2222-2222-222222222222' returning 1)
select count(*) as a_deleted_others from d;
reset role;
```
기대: `anon_sees=0`, `a_sees=1`, `a_deleted_others=0`.

- [x] **Step 4: 테스트 데이터 정리** — MCP `execute_sql`

```sql
delete from auth.users where email in ('rls-test-a@example.com','rls-test-b@example.com');
select count(*) as remaining_favorites from user_favorites;  -- cascade로 0이어야
```
기대: `remaining_favorites=0`.

- [x] **Step 5: Commit**

```bash
git add supabase/migrations/0003_favorites.sql
git commit -m "feat: user_favorites 테이블 + 소유자 한정 RLS (0003)"
```

---

### Task 2: 브라우저 Supabase 클라이언트 + 로그인 버튼

**Files:**
- Create: `apps/web/lib/supabase-browser.ts`
- Create: `apps/web/components/AuthButton.tsx`
- Modify: `apps/web/components/Header.tsx`
- Modify: `apps/web/messages/{ko,vi,en}.json`

**Interfaces:**
- Produces: `supabaseBrowser: SupabaseClient` (모듈 싱글턴), `<AuthButton />`
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (이미 Vercel·로컬에 설정됨)

- [x] **Step 1: 브라우저 클라이언트**

`apps/web/lib/supabase-browser.ts`:

```ts
"use client";

import { createClient } from "@supabase/supabase-js";

/** 브라우저 전용 클라이언트 — 세션은 localStorage, OAuth 복귀 시 URL의 code를 자동 교환한다.
 *  서버용 클라이언트는 lib/db.ts(server-only)로 분리되어 있다. */
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

- [x] **Step 2: 메시지 키 추가** (세 파일의 최상위에 `auth` 객체 신설)

```
ko: "auth": { "signIn": "로그인", "signOut": "로그아웃", "signInGoogle": "Google로 계속하기", "myList": "내 보관함", "signInToSave": "로그인하면 스킬을 담아둘 수 있어요", "failed": "로그인에 실패했어요. 잠시 뒤 다시 시도해주세요." }
vi: "auth": { "signIn": "Đăng nhập", "signOut": "Đăng xuất", "signInGoogle": "Tiếp tục với Google", "myList": "Đã lưu", "signInToSave": "Đăng nhập để lưu skill", "failed": "Đăng nhập thất bại. Vui lòng thử lại sau." }
en: "auth": { "signIn": "Sign in", "signOut": "Sign out", "signInGoogle": "Continue with Google", "myList": "Saved", "signInToSave": "Sign in to save skills", "failed": "Sign-in failed. Please try again in a moment." }
```

- [x] **Step 3: AuthButton 작성**

`apps/web/components/AuthButton.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthButton() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <span className="text-xs text-ink-soft">&nbsp;</span>;

  if (!email) {
    return (
      <button
        type="button"
        onClick={async () => {
          const { error } = await supabaseBrowser.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.href },
          });
          if (error) alert(t("failed"));
        }}
        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink"
      >
        {t("signIn")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <Link href="/favorites" className="text-ink-soft hover:text-ink">
        {t("myList")}
      </Link>
      <button
        type="button"
        onClick={() => supabaseBrowser.auth.signOut()}
        className="text-ink-soft hover:text-ink"
      >
        {t("signOut")}
      </button>
    </div>
  );
}
```

- [x] **Step 4: 헤더에 붙이기**

`apps/web/components/Header.tsx` — import 추가:

```tsx
import AuthButton from "./AuthButton";
```

`<div className="ml-auto">` 블록을 다음으로 교체 (언어 전환 왼쪽에 인증 UI):

```tsx
        <div className="ml-auto flex items-center gap-3">
          <AuthButton />
          <Suspense fallback={null}>
            <LocaleSwitcher />
          </Suspense>
        </div>
```

- [x] **Step 5: 타입체크 + Commit**

```bash
npm run typecheck -w web
git add apps/web/lib/supabase-browser.ts apps/web/components apps/web/messages
git commit -m "feat(web): 브라우저 Supabase 클라이언트 + 헤더 Google 로그인 버튼"
```

---

### Task 3: ❤️ 즐겨찾기 (Provider + 버튼)

**Files:**
- Create: `apps/web/components/FavoritesProvider.tsx`
- Create: `apps/web/components/FavoriteButton.tsx`
- Modify: `apps/web/components/SkillCard.tsx`
- Modify: `apps/web/app/[locale]/layout.tsx`
- Modify: `apps/web/app/[locale]/skills/[slug]/page.tsx`

**Interfaces:**
- Consumes: `supabaseBrowser` (Task 2), `user_favorites` (Task 1)
- Produces: `useFavorites(): { ids: Set<string>; toggle(id: string): Promise<void>; signedIn: boolean }`, `<FavoriteButton skillId />`

- [x] **Step 1: FavoritesProvider 작성** — 사용자 즐겨찾기 id를 페이지당 한 번만 로드

`apps/web/components/FavoritesProvider.tsx`:

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Ctx {
  ids: Set<string>;
  signedIn: boolean;
  toggle: (skillId: string) => Promise<void>;
}

const FavoritesContext = createContext<Ctx>({
  ids: new Set(),
  signedIn: false,
  toggle: async () => {},
});

export function useFavorites() {
  return useContext(FavoritesContext);
}

export default function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async (uid: string | null) => {
    setUserId(uid);
    if (!uid) {
      setIds(new Set());
      return;
    }
    const { data } = await supabaseBrowser.from("user_favorites").select("skill_id");
    setIds(new Set((data ?? []).map((r) => r.skill_id as string)));
  }, []);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => load(data.session?.user.id ?? null));
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, session) =>
      void load(session?.user.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const toggle = useCallback(
    async (skillId: string) => {
      if (!userId) return;
      const had = ids.has(skillId);
      // 낙관적 갱신 — 실패 시 되돌린다
      setIds((prev) => {
        const next = new Set(prev);
        if (had) next.delete(skillId);
        else next.add(skillId);
        return next;
      });
      const { error } = had
        ? await supabaseBrowser
            .from("user_favorites")
            .delete()
            .eq("user_id", userId)
            .eq("skill_id", skillId)
        : await supabaseBrowser.from("user_favorites").insert({ user_id: userId, skill_id: skillId });
      if (error) {
        setIds((prev) => {
          const next = new Set(prev);
          if (had) next.add(skillId);
          else next.delete(skillId);
          return next;
        });
      }
    },
    [ids, userId],
  );

  return (
    <FavoritesContext.Provider value={{ ids, signedIn: !!userId, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}
```

- [x] **Step 2: FavoriteButton 작성**

`apps/web/components/FavoriteButton.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useFavorites } from "./FavoritesProvider";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function FavoriteButton({ skillId }: { skillId: string }) {
  const t = useTranslations("auth");
  const { ids, signedIn, toggle } = useFavorites();
  const on = ids.has(skillId);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? t("myList") : t("signInToSave")}
      title={signedIn ? undefined : t("signInToSave")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!signedIn) {
          void supabaseBrowser.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.href },
          });
          return;
        }
        void toggle(skillId);
      }}
      className={`rounded-lg px-2 py-1 text-sm transition-colors ${
        on ? "text-accent" : "text-ink-soft hover:text-ink"
      }`}
    >
      {on ? "♥" : "♡"}
    </button>
  );
}
```

- [x] **Step 3: layout에 Provider 추가**

`apps/web/app/[locale]/layout.tsx` — import 추가:

```tsx
import FavoritesProvider from "@/components/FavoritesProvider";
```

`<NextIntlClientProvider>` 내부를 감싼다:

```tsx
        <NextIntlClientProvider>
          <FavoritesProvider>
            <Header />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4">{children}</main>
            <Footer />
          </FavoritesProvider>
        </NextIntlClientProvider>
```

- [x] **Step 4: SkillCard에 ❤️ 추가** — `<Link>` 안에 버튼을 넣으면 앵커 중첩이 되므로 카드를 `relative` 컨테이너로 감싸고 버튼은 앵커 **밖**에 절대 배치한다

`apps/web/components/SkillCard.tsx` 전체를 다음으로 교체:

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SkillListItem } from "@/lib/db";
import Chip from "./Chip";
import FavoriteButton from "./FavoriteButton";

export default function SkillCard({ skill }: { skill: SkillListItem }) {
  const t = useTranslations();
  return (
    <div className="relative">
      <Link
        href={`/skills/${skill.slug}`}
        className="group block rounded-xl border border-line bg-surface p-4 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm"
      >
        <div className="mb-1 flex items-baseline justify-between gap-2 pr-8">
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
      <div className="absolute top-3 right-3">
        <FavoriteButton skillId={skill.id} />
      </div>
    </div>
  );
}
```

- [x] **Step 5: 상세 페이지 제목 옆에 ❤️ 추가**

`apps/web/app/[locale]/skills/[slug]/page.tsx` — import 추가:

```tsx
import FavoriteButton from "@/components/FavoriteButton";
```

제목 블록의 `official` 배지 뒤에 추가:

```tsx
          <FavoriteButton skillId={skill.id} />
```

- [x] **Step 6: 타입체크 + Commit**

```bash
npm run typecheck -w web
git add apps/web/components 'apps/web/app/[locale]/layout.tsx' 'apps/web/app/[locale]/skills/[slug]/page.tsx'
git commit -m "feat(web): ❤️ 즐겨찾기 — 페이지당 1회 로드 Provider + 낙관적 갱신 버튼"
```

---

### Task 4: 내 보관함 페이지 + 스모크

**Files:**
- Create: `apps/web/app/[locale]/favorites/page.tsx`
- Create: `apps/web/components/FavoritesList.tsx`
- Modify: `apps/web/messages/{ko,vi,en}.json` (`auth.empty`, `auth.loading`)

**Interfaces:**
- Consumes: `useFavorites` (Task 3), `supabaseBrowser`
- Produces: `/{locale}/favorites` (noindex)

- [x] **Step 1: 메시지 2키 추가** — 세 파일의 `auth` 객체에 병합

```
ko: "empty": "아직 담은 스킬이 없어요. 마음에 드는 스킬에서 ♡를 눌러보세요.", "loading": "불러오는 중…"
vi: "empty": "Chưa lưu skill nào. Bấm ♡ ở skill bạn thích.", "loading": "Đang tải…"
en: "empty": "Nothing saved yet. Tap ♡ on a skill you like.", "loading": "Loading…"
```

- [x] **Step 2: FavoritesList 작성** — 담은 id로 스킬을 클라이언트에서 조회 (공개 읽기 정책 그대로 사용)

`apps/web/components/FavoritesList.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useFavorites } from "./FavoritesProvider";

interface Row {
  id: string;
  slug: string;
  name: string;
  one_liner: string;
}

export default function FavoritesList() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { ids, signedIn } = useFavorites();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (ids.size === 0) {
      setRows([]);
      return;
    }
    const idList = [...ids];
    void supabaseBrowser
      .from("skills")
      .select("id, slug, skill_translations(locale, name, one_liner)")
      .eq("status", "visible")
      .in("id", idList)
      .then(({ data }) => {
        setRows(
          (data ?? []).map((r) => {
            const trs = (r.skill_translations ?? []) as {
              locale: string;
              name: string;
              one_liner: string;
            }[];
            const tr = trs.find((x) => x.locale === locale) ?? trs.find((x) => x.locale === "en") ?? trs[0];
            return {
              id: r.id as string,
              slug: r.slug as string,
              name: tr?.name ?? (r.slug as string),
              one_liner: tr?.one_liner ?? "",
            };
          }),
        );
      });
  }, [ids, locale]);

  if (!signedIn) return <p className="text-sm text-ink-soft">{t("signInToSave")}</p>;
  if (rows === null) return <p className="text-sm text-ink-soft">{t("loading")}</p>;
  if (rows.length === 0) return <p className="text-sm text-ink-soft">{t("empty")}</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((r) => (
        <Link
          key={r.id}
          href={`/skills/${r.slug}`}
          className="block rounded-xl border border-line bg-surface p-4 hover:shadow-sm"
        >
          <h3 className="mb-1 truncate font-display text-lg font-bold">{r.name}</h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{r.one_liner}</p>
        </Link>
      ))}
    </div>
  );
}
```

- [x] **Step 3: 보관함 페이지 작성** (noindex, sitemap 제외)

`apps/web/app/[locale]/favorites/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import FavoritesList from "@/components/FavoritesList";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  // 사용자별 페이지 — 크롤러에겐 빈 껍데기다
  return { title: t("auth.myList"), robots: { index: false, follow: false } };
}

export default async function FavoritesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <div className="py-10">
      <h1 className="mb-6 font-display text-3xl font-bold">{t("myList")}</h1>
      <FavoritesList />
    </div>
  );
}
```

- [x] **Step 4: 클린 빌드 + 스모크**

```bash
rm -rf apps/web/.next && npm run build -w web 2>&1 | tail -20
(cd apps/web && npx next start -p 3402 > /tmp/m4c.log 2>&1 &) ; sleep 6
# 보관함 페이지 3개 언어 + noindex
for L in ko vi en; do curl -s -o /dev/null -w "  $L/favorites = %{http_code}\n" http://localhost:3402/$L/favorites; done
curl -s http://localhost:3402/ko/favorites | grep -o '<meta name="robots"[^>]*>'
# sitemap에 favorites 없어야 (0)
curl -s http://localhost:3402/sitemap.xml | grep -c 'favorites'
# 비로그인 헤더에 로그인 버튼, 카드에 ♡
curl -s http://localhost:3402/ko | grep -c '로그인'
curl -s http://localhost:3402/ko | grep -c '♡'
# 상세 페이지 ♡ + 앵커 중첩 없음(<a> 안에 <button> 금지)
curl -s http://localhost:3402/ko/skills/skill-creator | grep -c '♡'
# 회귀
for P in /ko /ko/skills /ko/guide /ko/nope; do curl -s -o /dev/null -w "  $P = %{http_code}\n" http://localhost:3402$P; done
curl -s -o /dev/null -w "  zip = %{http_code}\n" http://localhost:3402/api/skills/skill-creator/zip
```
기대: favorites 3개 200 + `noindex`, sitemap favorites 0건, 홈에 로그인·♡ 1건 이상, 상세 ♡ 1건 이상, 회귀 200/200/200/404 + zip 200.

- [x] **Step 5: 앵커 중첩 검사** (HTML 유효성 — `<a>` 안에 `<button>`이 없어야)

```bash
curl -s http://localhost:3402/ko | python3 -c "
import sys, re
h = sys.stdin.read()
bad = re.findall(r'<a\b[^>]*>(?:(?!</a>).)*?<button', h, re.S)
print('앵커 안 버튼:', len(bad), '(0이어야)')
"
```

- [x] **Step 6: 서버 종료 + Commit**

```bash
lsof -nP -iTCP:3402 -sTCP:LISTEN -t | xargs kill
git add apps/web/app apps/web/components apps/web/messages
git commit -m "feat(web): 내 보관함 페이지(noindex) + 즐겨찾기 목록"
```

---

### Task 5: Google 로그인 활성화 (사용자 동행 — 코드 작업 아님)

**Files:** 없음

- [x] **Step 1: master 머지·push는 사용자 승인 후** (push = Vercel 자동 배포)

```bash
git checkout master && git merge --no-ff m4-login -m "Merge branch 'm4-login': M4-C 로그인·즐겨찾기" && npm test -w pipeline && git push
```

- [x] **Step 2: Google Cloud OAuth 클라이언트 발급 안내** (사용자 클릭 — 대화로 단계별 안내)
  - https://console.cloud.google.com/apis/credentials → 프로젝트 생성 → OAuth 동의 화면(External, 앱 이름·이메일) → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID → 웹 애플리케이션
  - **승인된 리디렉션 URI**에 정확히 이것 하나: `https://cbyuzwxamjdzxhltcjcl.supabase.co/auth/v1/callback`
  - 발급된 클라이언트 ID·시크릿을 Supabase 대시보드 → Authentication → Providers → Google에 붙여넣고 Enable

- [x] **Step 3: Supabase URL 설정** (사용자 클릭)
  - Authentication → URL Configuration → Site URL `https://skillmart.dev`
  - Redirect URLs에 `https://skillmart.dev/**` 추가

- [x] **Step 4: 프로덕션 로그인 실검증** (사용자가 로그인 → 내가 DB로 확인)
  - MCP `execute_sql`: `select count(*) from auth.users;` → 1 이상
  - 사용자가 ♡ 누른 뒤: `select count(*) from user_favorites;` → 1 이상

---

## Self-Review 결과

1. **스펙 커버리지**: 간단 회원가입(T2, Google만)·❤️ 저장(T3)·내 보관함(T4)·소유자 한정 RLS(T1)·자격증명 활성화(T5). "N명이 담았어요"는 Global Constraints에서 명시적으로 범위 제외.
2. **플레이스홀더 스캔**: 없음. T5는 외부 대시보드 작업이라 코드 블록 대신 정확한 URL·리디렉션 값을 명시.
3. **타입 일관성**: `useFavorites()` 반환 `{ ids, signedIn, toggle }`이 T3 정의 = FavoriteButton·FavoritesList 사용처와 일치. `FavoriteButton` prop은 `skillId` 하나 — SkillCard(`skill.id`)·상세(`skill.id`) 양쪽 모두 `SkillListItem.id`(string)를 넘긴다. `supabaseBrowser`는 T2에서 정의되어 T3·T4가 import.
