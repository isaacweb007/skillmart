# M4-B 쉬운 설치 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 터미널을 쓰지 않는 Claude 앱(데스크톱·웹) 사용자가 스킬을 ZIP 한 번 받아 설치할 수 있게 하고, Claude Code 사용자는 한글 프롬프트 붙여넣기로 설치하게 한다. 처음 온 사람을 위한 "스킬이 뭐예요?" 안내 페이지를 3개 언어로 낸다.

**Architecture:** 스킬 폴더 ZIP은 라우트 핸들러 `/api/skills/[slug]/zip`이 요청 시 생성한다 — DB의 `repo_full_name`+`path`로 GitHub Trees API(저장소 10개뿐, fetch 캐시로 사실상 무료)에서 파일 목록을 얻고 `raw.githubusercontent.com`에서 내용을 받아 `fflate.zipSync`로 `{slug}/` 루트 구조로 압축, CDN 캐시 헤더를 붙여 반환한다. 설치 UI는 client state 없이 native `<details>` 2개(앱/Code)로 갈라 놓는다.

**Tech Stack:** Next.js 15 Route Handler, fflate 0.8.3(의존성 0), supabase-js, next-intl v4.

## Global Constraints

- **ZIP 내부 구조는 `{slug}/SKILL.md` — 반드시 최상위에 스킬 폴더 하나**. Claude 앱 업로드 규격이며 루트에 파일을 흩뿌리면 업로드가 거부된다 (출처: Claude 지원문서 "The ZIP should contain the skill folder as its root")
- Vercel 함수 응답 상한 4.5MB — **생성된 ZIP이 4MB를 넘으면 GitHub 폴더 페이지로 302 리다이렉트**(실측: 490개 중 초과 1개 `canvas-design` 5.6MB). 이 상한은 `ponytail:` 주석으로 명시
- GitHub 호출은 **비인증** — 토큰 env 추가 금지. Trees API는 저장소당 1회이고 고유 저장소 10개, `next: { revalidate }` 캐시로 시간당 60회 제한에 닿지 않는다
- 파일 목록 필터는 `path`의 디렉토리 접두사(`dirname(path) + "/"`) 기준. `path`는 490건 전부 `.../SKILL.md`로 끝남(실측)
- 신뢰 경고 문구 필수 — 제3자 GitHub 코드를 배포하므로 "출처를 확인하고 설치하라"는 안내를 설치 UI와 안내 페이지 양쪽에 넣는다 (Anthropic 공식 보안 권고)
- 새 UI 문자열은 ko/vi/en **3개 파일 모두** 추가. 키 누락 시 next-intl이 런타임 에러를 던진다
- 안내 페이지 경로는 `/{locale}/guide` — Task 3에서 sitemap 정적 항목에 추가
- 커밋은 한국어 `feat(web):` 프리픽스, 브랜치 `m4-easy-install`
- 로컬 검증 빌드는 반드시 `rm -rf apps/web/.next` 후 (M4-A 교훈: dev 캐시가 낡은 DB 스냅샷 주입)

---

### Task 1: ZIP 생성 라우트

**Files:**
- Modify: `apps/web/package.json` (fflate 의존성)
- Modify: `apps/web/lib/db.ts` (getSkillSource 추가)
- Create: `apps/web/app/api/skills/[slug]/zip/route.ts`

**Interfaces:**
- Produces: `getSkillSource(slug: string): Promise<{ repo_full_name: string; path: string } | null>`, `GET /api/skills/{slug}/zip` → `application/zip` 또는 302
- Consumes: 없음

- [x] **Step 1: 브랜치 + 의존성**

```bash
cd /Users/isaac/Downloads/클로드스킬마트
git checkout -b m4-easy-install
npm install fflate@0.8.3 -w web
```
기대: `apps/web/package.json`의 dependencies에 `"fflate": "0.8.3"` 추가, 하위 의존성 0건.

- [x] **Step 2: db.ts에 소스 조회 헬퍼 추가** (`getAllVisibleForSitemap` 정의 바로 위에 삽입)

```ts
/** ZIP 생성용 GitHub 좌표 — visible 스킬만 */
export const getSkillSource = cache(
  async (slug: string): Promise<{ repo_full_name: string; path: string } | null> => {
    const { data, error } = await db
      .from("skills")
      .select("repo_full_name, path")
      .eq("status", "visible")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(`skill source 조회 실패: ${error.message}`);
    return data as { repo_full_name: string; path: string } | null;
  },
);
```

- [x] **Step 3: ZIP 라우트 작성**

`apps/web/app/api/skills/[slug]/zip/route.ts`:

```ts
import { zipSync } from "fflate";
import { getSkillSource } from "@/lib/db";

/** ponytail: 응답 4MB 상한(Vercel 함수 제한 4.5MB)을 넘으면 GitHub 폴더로 넘긴다.
 *  실측 490건 중 초과 1건뿐. 더 큰 스킬이 늘면 Supabase Storage 사전 생성으로 올린다. */
const MAX_ZIP_BYTES = 4 * 1024 * 1024;
const MAX_RAW_BYTES = 12 * 1024 * 1024;
const MAX_FILES = 400;

interface TreeEntry {
  path: string;
  type: string;
  size?: number;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const src = await getSkillSource(slug);
  if (!src) return new Response("Not found", { status: 404 });

  const dir = src.path.slice(0, src.path.lastIndexOf("/") + 1);
  const githubFolder = `https://github.com/${src.repo_full_name}/tree/HEAD/${dir.slice(0, -1)}`;

  const treeRes = await fetch(
    `https://api.github.com/repos/${src.repo_full_name}/git/trees/HEAD?recursive=1`,
    { headers: { Accept: "application/vnd.github+json" }, next: { revalidate: 3600 } },
  );
  if (!treeRes.ok) return Response.redirect(githubFolder, 302);
  const tree = (await treeRes.json()) as { tree?: TreeEntry[] };
  const files = (tree.tree ?? []).filter((t) => t.type === "blob" && t.path.startsWith(dir));

  const rawBytes = files.reduce((a, f) => a + (f.size ?? 0), 0);
  if (files.length === 0 || files.length > MAX_FILES || rawBytes > MAX_RAW_BYTES) {
    return Response.redirect(githubFolder, 302);
  }

  const entries: Record<string, Uint8Array> = {};
  await Promise.all(
    files.map(async (f) => {
      const res = await fetch(
        `https://raw.githubusercontent.com/${src.repo_full_name}/HEAD/${f.path}`,
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) throw new Error(`raw fetch 실패: ${f.path} ${res.status}`);
      // ZIP 루트는 스킬 폴더 하나 — Claude 앱 업로드 규격
      entries[`${slug}/${f.path.slice(dir.length)}`] = new Uint8Array(await res.arrayBuffer());
    }),
  );

  const zip = zipSync(entries, { level: 6 });
  if (zip.byteLength > MAX_ZIP_BYTES) return Response.redirect(githubFolder, 302);

  return new Response(zip as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}.zip"`,
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
```

- [x] **Step 4: 타입체크**

```bash
npm run typecheck -w web
```
기대: 에러 0.

- [x] **Step 5: 실제 ZIP 검증** (dev 서버 없이 프로덕션 빌드로 — 3401 포트)

```bash
rm -rf apps/web/.next && npm run build -w web && (npx next start -p 3401 > /tmp/m4b.log 2>&1 &) && sleep 5
# 단일 파일 스킬
curl -s -o /tmp/a.zip -w "status=%{http_code} size=%{size_download}\n" http://localhost:3401/api/skills/morning/zip
unzip -l /tmp/a.zip | head -8
# 다중 파일 스킬
curl -s -o /tmp/b.zip -w "status=%{http_code} size=%{size_download}\n" http://localhost:3401/api/skills/babysit/zip
unzip -l /tmp/b.zip | head -8
# 4MB 초과 스킬 → GitHub 리다이렉트
curl -s -o /dev/null -w "status=%{http_code} location=%{redirect_url}\n" http://localhost:3401/api/skills/canvas-design/zip
# 없는 슬러그 → 404
curl -s -o /dev/null -w "status=%{http_code}\n" http://localhost:3401/api/skills/no-such-skill/zip
```
기대: 앞 두 개 status=200 + `unzip -l` 목록의 모든 항목이 `{slug}/`로 시작하고 `{slug}/SKILL.md` 존재. canvas-design은 302 + location이 github.com. 없는 슬러그는 404.

- [x] **Step 6: 서버 종료 + Commit**

```bash
lsof -nP -iTCP:3401 -sTCP:LISTEN -t | xargs kill
git add apps/web/package.json package-lock.json apps/web/lib/db.ts apps/web/app/api
git commit -m "feat(web): 스킬 ZIP 생성 라우트 — Claude 앱 업로드 규격({slug}/ 루트), 4MB 초과는 GitHub로"
```

---

### Task 2: 설치 UI 재구성 (앱 / Claude Code 분기)

**Files:**
- Create: `apps/web/components/InstallBlocks.tsx`
- Modify: `apps/web/app/[locale]/skills/[slug]/page.tsx` (InstallReceipt → InstallBlocks 교체, props에 slug·repo 추가)
- Modify: `apps/web/messages/ko.json`, `vi.json`, `en.json`
- Delete: `apps/web/components/InstallReceipt.tsx` (InstallBlocks가 흡수)

**Interfaces:**
- Consumes: `GET /api/skills/{slug}/zip` (Task 1), 기존 `CopyButton`
- Produces: `<InstallBlocks slug repo dir command guideMd />`

- [x] **Step 1: ko.json에 install 키 추가** (`detail` 객체 안에 병합)

```json
    "installAppTitle": "Claude 앱에 설치 (터미널 필요 없음)",
    "installAppStep1": "아래 버튼으로 ZIP 파일을 받으세요.",
    "installAppStep2": "Claude 설정 → Capabilities에서 '코드 실행 및 파일 생성'을 켭니다. (한 번만)",
    "installAppStep3": "Claude에서 Customize → Skills → + → '스킬 업로드'를 누르고 받은 ZIP을 올립니다.",
    "installAppDownload": "ZIP 내려받기",
    "installCodeTitle": "Claude Code에 설치",
    "installCodeAsk": "Claude에게 맡기기 — 아래 문장을 Claude Code에 붙여넣으세요",
    "installCodeManual": "직접 명령으로 설치하기",
    "installTrust": "제3자가 만든 스킬입니다. 설치 전 원본 저장소를 한 번 확인하세요.",
    "installPrompt": "클로드스킬마트에서 찾은 스킬을 설치해줘.\nGitHub 저장소 {repo} 의 {dir} 폴더를 내 ~/.claude/skills/{slug}/ 에 그대로 복사해줘.\n설치가 끝나면 이 스킬로 무엇을 할 수 있는지 한 줄로 알려줘."
```

- [x] **Step 2: vi.json에 같은 키 추가**

```json
    "installAppTitle": "Cài vào ứng dụng Claude (không cần terminal)",
    "installAppStep1": "Tải tệp ZIP bằng nút bên dưới.",
    "installAppStep2": "Trong Claude, mở Settings → Capabilities và bật 'Code execution and file creation'. (chỉ một lần)",
    "installAppStep3": "Vào Customize → Skills → + → 'Upload a skill' rồi tải tệp ZIP lên.",
    "installAppDownload": "Tải ZIP",
    "installCodeTitle": "Cài vào Claude Code",
    "installCodeAsk": "Để Claude làm — dán câu dưới đây vào Claude Code",
    "installCodeManual": "Cài bằng lệnh thủ công",
    "installTrust": "Đây là skill do người khác tạo. Hãy kiểm tra repo gốc trước khi cài.",
    "installPrompt": "Hãy cài skill mình tìm thấy trên Claude Skill Mart.\nCopy thư mục {dir} từ repo GitHub {repo} vào ~/.claude/skills/{slug}/ của mình.\nSau khi cài xong, cho mình biết skill này làm được gì trong một câu."
```

- [x] **Step 3: en.json에 같은 키 추가**

```json
    "installAppTitle": "Install in the Claude app (no terminal)",
    "installAppStep1": "Download the ZIP with the button below.",
    "installAppStep2": "In Claude, open Settings → Capabilities and turn on 'Code execution and file creation'. (one time)",
    "installAppStep3": "Go to Customize → Skills → + → 'Upload a skill' and upload the ZIP.",
    "installAppDownload": "Download ZIP",
    "installCodeTitle": "Install in Claude Code",
    "installCodeAsk": "Let Claude do it — paste this into Claude Code",
    "installCodeManual": "Install with a command instead",
    "installTrust": "This is a third-party skill. Check the source repository before installing.",
    "installPrompt": "Install the skill I found on Claude Skill Mart.\nCopy the {dir} folder from the GitHub repo {repo} into my ~/.claude/skills/{slug}/.\nWhen it's done, tell me in one line what this skill can do."
```

- [x] **Step 4: InstallBlocks 컴포넌트 작성**

`apps/web/components/InstallBlocks.tsx` — 탭 대신 native `<details>` 2개(앱 먼저, 기본 열림):

```tsx
import Markdown from "react-markdown";
import { useTranslations } from "next-intl";
import CopyButton from "./CopyButton";

export default function InstallBlocks({
  slug,
  repo,
  dir,
  command,
  guideMd,
}: {
  slug: string;
  repo: string;
  dir: string;
  command: string | null;
  guideMd: string;
}) {
  const t = useTranslations("detail");
  const prompt = t("installPrompt", { repo, dir, slug });
  return (
    <section className="my-8 border-y-2 border-dashed border-line bg-surface px-5 py-6">
      <h2 className="mb-4 text-center font-display text-lg font-bold tracking-widest">
        · · · {t("install")} · · ·
      </h2>

      <details open className="mb-3 rounded-xl border border-line bg-bg p-4">
        <summary className="cursor-pointer font-display font-bold">{t("installAppTitle")}</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>{t("installAppStep1")}</li>
          <li>{t("installAppStep2")}</li>
          <li>{t("installAppStep3")}</li>
        </ol>
        <a
          href={`/api/skills/${slug}/zip`}
          className="mt-4 inline-block rounded-xl bg-accent px-5 py-3 font-semibold text-accent-ink"
        >
          ↓ {t("installAppDownload")}
        </a>
      </details>

      <details className="rounded-xl border border-line bg-bg p-4">
        <summary className="cursor-pointer font-display font-bold">{t("installCodeTitle")}</summary>
        <p className="mt-3 mb-2 text-sm text-ink-soft">{t("installCodeAsk")}</p>
        <div className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3">
          <pre className="min-w-0 flex-1 whitespace-pre-wrap font-mono-plex text-xs leading-relaxed">
            {prompt}
          </pre>
          <CopyButton text={prompt} />
        </div>
        {command && (
          <div className="mt-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-ink-soft">
              {t("installCodeManual")}
            </p>
            <div className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3">
              <code className="min-w-0 flex-1 break-all font-mono-plex text-xs leading-relaxed">
                {command}
              </code>
              <CopyButton text={command} />
            </div>
          </div>
        )}
      </details>

      <p className="mt-4 text-xs leading-relaxed text-ink-soft">⚠ {t("installTrust")}</p>

      <div className="md mt-6 font-body">
        <Markdown>{guideMd}</Markdown>
      </div>
    </section>
  );
}
```

- [x] **Step 5: 상세 페이지 교체**

`apps/web/app/[locale]/skills/[slug]/page.tsx`의 import에서 `InstallReceipt`를 `InstallBlocks`로 바꾸고:

```tsx
import InstallBlocks from "@/components/InstallBlocks";
```

`SkillDetail` 안의 사용처를 교체 (dir는 path의 디렉토리 부분, 끝 슬래시 제거):

```tsx
      <InstallBlocks
        slug={slug}
        repo={skill.repo_full_name}
        dir={skill.path.slice(0, skill.path.lastIndexOf("/"))}
        command={skill.install_command}
        guideMd={skill.install_guide_md}
      />
```

- [x] **Step 6: SkillDetail 타입·쿼리에 repo_full_name·path 추가**

`apps/web/lib/db.ts`의 `SkillDetail` 인터페이스에 두 필드 추가:

```ts
  repo_full_name: string;
  path: string;
```

`getSkillBySlug`의 select 문자열에서 `forks, last_commit_at, source_url, license, install_command,` 를 다음으로 교체:

```ts
        `${LIST_COLS}, forks, last_commit_at, source_url, license, install_command, repo_full_name, path,
```

- [x] **Step 7: 낡은 컴포넌트 삭제 + 타입체크**

```bash
rm apps/web/components/InstallReceipt.tsx
grep -rn "InstallReceipt" apps/web/ --include=*.tsx --include=*.ts   # 0건이어야
npm run typecheck -w web
```
기대: grep 0건, 타입 에러 0.

- [x] **Step 8: Commit**

```bash
git add apps/web/components apps/web/messages 'apps/web/app/[locale]/skills/[slug]/page.tsx' apps/web/lib/db.ts
git commit -m "feat(web): 설치 UI 분기 — Claude 앱 ZIP 업로드 안내 + Claude Code 프롬프트 복사, 신뢰 경고"
```

---

### Task 3: "스킬이 뭐예요?" 안내 페이지 + 헤더 링크 + sitemap

**Files:**
- Create: `apps/web/app/[locale]/guide/page.tsx`
- Modify: `apps/web/messages/ko.json`, `vi.json`, `en.json` (guide 섹션 + nav.guide)
- Modify: `apps/web/components/Header.tsx` (링크 1개)
- Modify: `apps/web/app/sitemap.ts` (`add("/guide")`)

**Interfaces:**
- Consumes: `pageAlternates` (M4-A의 `lib/site.ts`)
- Produces: `/{locale}/guide`

- [x] **Step 1: ko.json에 guide 섹션 추가** (최상위, `nav` 객체에 `"guide": "스킬이 뭐예요?"` 추가 + 아래 블록 추가)

```json
  "guide": {
    "title": "스킬이 뭐예요?",
    "lead": "스킬은 Claude에게 '이 일은 이렇게 해라'를 미리 적어둔 설명서 묶음입니다. 한 번 설치하면 관련된 부탁을 할 때 Claude가 알아서 꺼내 씁니다.",
    "whyTitle": "무엇이 좋아지나요",
    "why1": "매번 같은 설명을 다시 쓰지 않아도 됩니다.",
    "why2": "PPT·엑셀·문서 정리처럼 손이 많이 가는 일을 정해진 방식으로 처리합니다.",
    "why3": "필요할 때만 불려오므로 여러 개를 깔아도 느려지지 않습니다.",
    "howTitle": "어떻게 설치하나요",
    "howApp": "Claude 데스크톱·웹 사용자: 스킬 상세 페이지에서 ZIP을 받아 Claude 설정에 업로드합니다. 터미널을 쓰지 않습니다.",
    "howCode": "Claude Code 사용자: 상세 페이지의 문장을 복사해 Claude에게 붙여넣으면 알아서 설치합니다.",
    "safeTitle": "설치 전에 확인할 것",
    "safeBody": "스킬은 Claude에게 시키는 지시문과 실행 코드를 담고 있습니다. 낯선 저장소의 스킬은 원본을 먼저 살펴보세요. 이 사이트는 GitHub 공개 저장소를 안내할 뿐이며 스킬 내용을 보증하지 않습니다.",
    "cta": "스킬 둘러보기"
  },
```

- [x] **Step 2: vi.json에 같은 구조 추가**

```json
  "guide": {
    "title": "Skill là gì?",
    "lead": "Skill là bộ hướng dẫn viết sẵn cho Claude về cách làm một loại việc. Cài một lần, Claude sẽ tự dùng khi bạn nhờ việc liên quan.",
    "whyTitle": "Được lợi gì",
    "why1": "Không phải giải thích lại cùng một điều mỗi lần.",
    "why2": "Việc tốn công như làm PPT, Excel, dọn tài liệu được xử lý theo một cách nhất quán.",
    "why3": "Chỉ được gọi khi cần, nên cài nhiều cũng không chậm.",
    "howTitle": "Cài thế nào",
    "howApp": "Người dùng Claude desktop/web: tải ZIP ở trang chi tiết skill rồi tải lên trong cài đặt Claude. Không cần terminal.",
    "howCode": "Người dùng Claude Code: copy câu ở trang chi tiết và dán cho Claude, Claude sẽ tự cài.",
    "safeTitle": "Kiểm tra trước khi cài",
    "safeBody": "Skill chứa hướng dẫn và mã có thể chạy. Với repo lạ, hãy xem nguồn trước. Trang này chỉ dẫn tới repo công khai trên GitHub và không bảo đảm nội dung skill.",
    "cta": "Xem các skill"
  },
```

- [x] **Step 3: en.json에 같은 구조 추가**

```json
  "guide": {
    "title": "What is a Skill?",
    "lead": "A Skill is a written guide that tells Claude how to do a certain kind of work. Install it once and Claude pulls it up whenever your request matches.",
    "whyTitle": "Why it helps",
    "why1": "You stop re-explaining the same thing every time.",
    "why2": "Fiddly work like slide decks, spreadsheets and document cleanup gets done a consistent way.",
    "why3": "Skills load only when relevant, so many installed Skills don't slow Claude down.",
    "howTitle": "How to install",
    "howApp": "Claude desktop/web users: download the ZIP on a skill page and upload it in Claude's settings. No terminal.",
    "howCode": "Claude Code users: copy the sentence on the skill page and paste it to Claude — it installs the skill for you.",
    "safeTitle": "Check before you install",
    "safeBody": "Skills carry instructions and runnable code. For unfamiliar repositories, read the source first. This site points to public GitHub repositories and does not vouch for skill contents.",
    "cta": "Browse skills"
  },
```

- [x] **Step 4: nav.guide 키 추가** — 세 파일의 `nav` 객체에 각각:

```
ko: "guide": "스킬이 뭐예요?"
vi: "guide": "Skill là gì?"
en: "guide": "What is a Skill?"
```

- [x] **Step 5: 안내 페이지 작성**

`apps/web/app/[locale]/guide/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t("guide.title"),
    description: t("guide.lead"),
    alternates: pageAlternates(locale, "/guide"),
  };
}

export default async function GuidePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guide");
  return (
    <article className="mx-auto max-w-2xl py-10">
      <h1 className="mb-4 font-display text-3xl font-bold">{t("title")}</h1>
      <p className="mb-10 text-[15px] leading-relaxed text-ink-soft">{t("lead")}</p>

      <h2 className="mb-3 font-display text-xl font-bold">{t("whyTitle")}</h2>
      <ul className="mb-10 list-disc space-y-2 pl-5 text-[15px] leading-relaxed">
        <li>{t("why1")}</li>
        <li>{t("why2")}</li>
        <li>{t("why3")}</li>
      </ul>

      <h2 className="mb-3 font-display text-xl font-bold">{t("howTitle")}</h2>
      <div className="mb-10 space-y-3 text-[15px] leading-relaxed">
        <p className="rounded-xl border border-line bg-surface p-4">{t("howApp")}</p>
        <p className="rounded-xl border border-line bg-surface p-4">{t("howCode")}</p>
      </div>

      <h2 className="mb-3 font-display text-xl font-bold">{t("safeTitle")}</h2>
      <p className="mb-10 text-[15px] leading-relaxed text-ink-soft">{t("safeBody")}</p>

      <Link
        href="/skills"
        className="inline-block rounded-xl bg-accent px-5 py-3 font-semibold text-accent-ink"
      >
        {t("cta")} →
      </Link>
    </article>
  );
}
```

- [x] **Step 6: 헤더에 링크 추가**

`apps/web/components/Header.tsx`에서 `{t("nav.skills")}` 링크 바로 뒤에 같은 스타일로 추가 (기존 링크의 className을 그대로 복사해 쓴다):

```tsx
        <Link href="/guide">{t("nav.guide")}</Link>
```

- [x] **Step 7: sitemap에 /guide 추가**

`apps/web/app/sitemap.ts`의 `add("/skills");` 바로 뒤에:

```ts
  add("/guide");
```

- [x] **Step 8: 타입체크 + Commit**

```bash
npm run typecheck -w web
git add apps/web/app apps/web/components apps/web/messages
git commit -m "feat(web): 스킬 안내 페이지(3개 언어) + 헤더 링크 + sitemap 등록"
```

---

### Task 4: 클린 빌드 스모크

**Files:** 없음 (검증 전용)

- [x] **Step 1: 클린 프로덕션 빌드**

```bash
rm -rf apps/web/.next && npm run build -w web 2>&1 | tail -20
```
기대: 라우트 표에 `/[locale]/guide`, `/api/skills/[slug]/zip` 등장, 에러 0.

- [x] **Step 2: 서버 기동 + 단언**

```bash
(npx next start -p 3401 > /tmp/m4b.log 2>&1 &) && sleep 5
# 안내 페이지 3개 언어
for L in ko vi en; do curl -s -o /dev/null -w "$L guide=%{http_code}\n" http://localhost:3401/$L/guide; done
# canonical/hreflang 유지 확인
curl -s http://localhost:3401/ko/guide | grep -o '<link rel="canonical"[^>]*/>'
# sitemap에 guide 3건
curl -s http://localhost:3401/sitemap.xml | grep -c '/guide</loc>'
# 상세 페이지에 ZIP 버튼·프롬프트 존재
SLUG=morning
D=$(curl -s http://localhost:3401/ko/skills/$SLUG)
echo "$D" | grep -c "api/skills/$SLUG/zip"
echo "$D" | grep -c "~/.claude/skills/$SLUG/"
echo "$D" | grep -c "설치 전 원본 저장소"
# ZIP 실제 내용
curl -s -o /tmp/m.zip http://localhost:3401/api/skills/$SLUG/zip && unzip -l /tmp/m.zip | head -6
# 헤더 링크
echo "$D" | grep -o 'href="/ko/guide"' | head -1
```
기대: guide 3개 200, canonical `https://skillmart.dev/ko/guide`, sitemap guide 3건, 상세 페이지 grep 전부 1 이상, ZIP 목록 항목이 `morning/`으로 시작, 헤더 링크 존재.

- [x] **Step 3: 서버 종료**

```bash
lsof -nP -iTCP:3401 -sTCP:LISTEN -t | xargs kill
```

- [x] **Step 4: 결함 있으면 수정 커밋** (무결함이면 생략)

```bash
git add -A apps/web && git commit -m "fix(web): M4-B 스모크 반영 — <발견 내용>"
```

---

## Self-Review 결과

1. **스펙 커버리지**: ZIP 다운로드(T1)·앱/Code 설치 분기(T2)·Claude 프롬프트 복사(T2)·안내 페이지 3개 언어(T3)·신뢰 경고(T2·T3)·검증(T4). 애드센스는 M4-D로 분리(색인 후).
2. **플레이스홀더 스캔**: T4 Step 4의 `<발견 내용>`은 실행 시 결과 기재 — 그 외 없음.
3. **타입 일관성**: `getSkillSource` 반환형이 T1 정의 = 라우트 사용처 일치. `InstallBlocks` props(slug·repo·dir·command·guideMd)가 T2 Step 5 호출부와 일치. `SkillDetail`에 `repo_full_name`·`path` 추가(T2 Step 6)가 호출부보다 먼저 필요 — Step 5·6은 같은 커밋에 묶여 있어 순서 무관.
