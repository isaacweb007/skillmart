# 클로드스킬마트 — 설계 기획서

- 작성일: 2026-08-09
- 상태: 사용자 승인된 설계안의 문서화 (구현 전)
- 작업 폴더: `/Users/isaac/Downloads/클로드스킬마트`

## 1. 개요

**클로드스킬마트**는 Claude Code 사용자가 스킬을 발견하고, 자기 언어(한국어·베트남어·영어)로 이해하고, 복사-붙여넣기로 설치까지 안내받는 반응형 웹 서비스다.

핵심 차별점: **사람이 검수하지 않는다.** AI 파이프라인이 매일 GitHub·공식 저장소에서 스킬을 발굴하고, 품질을 평가하고, 3개 언어 해설을 생성해 자동 배포한다. 운영자(이삭)는 파이프라인을 관리할 뿐 콘텐츠를 직접 만들지 않는다.

사용 시나리오:
- 데스크탑: Claude Code 옆에 좁은 세로 창(400~600px)으로 띄워놓고 참조
- 모바일: 단독 브라우징으로 스킬 탐색

## 2. 목표와 비목표

### 목표 (MVP)
1. 일일 자동 파이프라인: 발굴 → 선별 → 분석·번역(병렬) → 배포
2. 3개 언어(ko/vi/en) 콘텐츠와 UI
3. 검색, 카테고리 탐색, 인기·트렌딩 랭킹
4. 스킬 상세: 해설, 활용 예시, AI 한줄평, 설치 가이드, GitHub 지표, 원본 링크
5. 상황별 추천 컬렉션("PPT 만들 때" 등, 파이프라인이 생성)
6. 회원 기능: 구글 로그인, 즐겨찾기, 별점·리뷰
7. 시작 가이드 정적 페이지("스킬이란?", "처음 설치하기")
8. Claude.ai 감성의 미니멀 UI, 다크모드, 모바일 퍼스트

### 비목표 (로드맵으로 이관, MVP에서 하지 않음)
- 커뮤니티 스킬 직접 제출·호스팅
- 결제·유료 마켓 (수익화는 트래픽 검증 후 결정 — 사용자 확정)
- 관리자 웹 UI (운영은 SQL/스크립트로)
- 크롬 확장프로그램, 네이티브 앱
- ko/vi/en 외 언어

## 3. 타깃 사용자

- 1차: 한국어 Claude Code 사용자 중 스킬 개념·설치법을 모르는 초보~중급
- 2차: 베트남어·영어 사용자 (같은 콘텐츠, 언어만 전환)
- 니즈: "뭐가 좋은 스킬인지", "내 상황에 뭘 깔아야 하는지", "어떻게 까는지"

## 4. 시장 현황 (2026-08 조사)

영어권은 대형 애그리게이터 다수 존재: claudemarketplaces.com(스킬 2.3만 개), skillsplayground.com, claudeskills.info, skillsmp.com, mcpmarket.com. 한국어·베트남어권은 커뮤니티 글·블로그로 파편화되어 있고 전용 서비스가 없다.

포지션: 물량 경쟁이 아니라 **품질 게이트를 통과한 스킬만, 현지어 해설과 함께**. 비영어권 우선 + AI 자동 큐레이션이 차별점.

## 5. 시스템 아키텍처

```
[GitHub API] ──발굴──> [일일 파이프라인 (GitHub Actions cron, TypeScript)]
                            │  선별 → 스코어링 → Claude 분석·번역(병렬/Batch)
                            ▼
                       [Supabase (Postgres)]
                            │  콘텐츠 + 유저 데이터
                            ▼
[Next.js on Vercel] ──ISR/서버 쿼리──> 사용자 (ko/vi/en 반응형 웹)
```

- 콘텐츠의 단일 소스는 Supabase. 파이프라인이 쓰고 웹이 읽는다. 콘텐츠 갱신에 웹 재배포 불필요.
- 파이프라인과 웹은 한 저장소(모노레포): `apps/web`(Next.js), `pipeline/`(스크립트), `supabase/`(마이그레이션).

## 6. 일일 AI 파이프라인

실행: GitHub Actions cron, 매일 03:00 KST (18:00 UTC). 수동 실행(workflow_dispatch)도 지원. 언어: TypeScript(Node), `@anthropic-ai/sdk` 사용.

### 6.1 발굴 (Discover)
소스, 우선순위 순:
1. 시드 저장소(코드에 상수로 관리): `anthropics/skills`(공식), 주요 awesome 리스트(awesome-claude-code 등), 대형 스킬 모음 저장소
2. GitHub Code Search: `filename:SKILL.md`
3. GitHub 저장소 토픽 검색: `claude-skills`, `claude-code-skills`, `claude-code-plugin`

수집 항목: repo full_name, 스킬 경로, SKILL.md 원문, README(있으면), stars, forks, 최종 커밋일, 라이선스.
Rate limit 대응: 인증 토큰 사용, 검색 API 분당 제한에 맞춘 백오프, 페이지네이션 상한(런당 검색 신규 후보 최대 500개 — 초과분은 다음 런에서 이어서).

### 6.2 선별 (Filter)
- 유효성: SKILL.md frontmatter에 `name`과 `description`이 있어야 통과
- 중복 제거: `repo_full_name + path`가 natural key. 같은 키는 갱신으로 처리
- 신규·변경분만 다음 단계로: SKILL.md 내용 해시가 기존과 같으면 지표(stars 등)만 갱신하고 분석 생략 → **비용 통제의 핵심**

### 6.3 분석·번역 (Analyze & Translate — 병렬 AI 워커)
- 스킬 1개당 Claude 호출 1회로 다음을 **한 번에 생성** (구조화 출력 `output_config.format`으로 JSON 스키마 강제):
  - 카테고리(고정 분류 중 1개), 태그(최대 5), 난이도(입문/중급/고급)
  - AI 품질 점수(0~10): SKILL.md 완성도, 설명 명확성, 범용성 기준 루브릭
  - AI 한줄평(강점·주의점)
  - 언어별(ko/vi/en): 이름 번역, 한줄요약, 해설(무엇을 해주나, 이런 사람에게, 활용 예시 2~3개), 설치 안내 문구
- 모델: `claude-opus-5` + **Batch API**(50% 할인, 지연 무관한 야간 배치에 적합). 비용이 부담되면 번역 파트만 하위 모델로 낮추는 옵션이 있으나, 품질 트레이드오프가 있으므로 첫 실측 후 운영자가 결정한다.
- 병렬성: Batch API가 서버에서 병렬 처리(런당 1개 배치로 제출, 폴링 후 수확). Batch 미사용 경로(수동 소량 재처리)는 동시 8 워커로 직접 호출.
- 실패 처리: 배치 결과가 `errored`인 항목은 상태 `pending_analysis`로 남겨 다음 런에서 자동 재시도. 3회 연속 실패 시 `failed`로 마킹하고 로그에 남김.

### 6.4 배포 (Publish)
- Supabase upsert. 노출 조건(모두 충족 시 `visible`):
  - 유효 SKILL.md **그리고** AI 품질 점수 ≥ 5
  - 예외: `anthropics/*` 공식 저장소 스킬은 점수 무관 노출
- 랭킹 점수(목록 정렬용): `rank = 0.5 × (AI점수/10) + 0.3 × min(log10(stars+1)/4, 1) + 0.2 × 최신성(최종 커밋 180일 이내 선형 감쇠)`
- 소스 repo가 삭제·비공개 전환된 스킬은 발굴 단계에서 감지해 `hidden` 처리(데이터는 보존)
- 트렌딩: 최근 7일 stars 증가량(일일 스냅샷 차이)으로 계산

### 6.5 컬렉션 생성 (주 1회, 일요일 런에 포함)
- 현재 `visible` 스킬 목록을 입력으로 Claude가 상황별 세트 6~10개 생성("PPT 만들 때", "블로그 글쓰기", "코드 리뷰" 등) — 제목·설명은 3개 언어
- 기존 컬렉션은 대체하되, `is_pinned = true`인 컬렉션은 파이프라인이 건드리지 않음(운영자 수동 관리용)

### 6.6 백필과 비용
- 첫 실행은 백로그 전체(수백~1천 개 예상)를 배치로 처리. Opus 5 Batch 기준 스킬당 대략 입력 4K·출력 5K 토큰으로 500개 ≈ $30~50 수준으로 추정하며, **첫 실행에서 실측해 `pipeline_runs`에 기록**한다. 일일 델타(신규·변경 수십 건)는 1달러 미만 예상.
- 예산 안전장치: 런당 분석 대상 상한 1,000건. 초과분은 다음 런으로 이월.

## 7. 데이터 모델 (Supabase / Postgres)

```sql
-- 콘텐츠 (파이프라인이 service_role로 쓰기, 웹은 읽기 전용)
skills (
  id uuid pk, repo_full_name text, path text,          -- unique(repo_full_name, path)
  slug text unique,                                     -- URL용 (스킬명 기반, 충돌 시 repo 접두)
  source_url text, license text,
  stars int, forks int, last_commit_at timestamptz,
  content_hash text,                                    -- SKILL.md 해시(변경 감지)
  category text, tags text[], difficulty text,          -- AI 분류
  ai_score numeric, ai_review_ko text, ai_review_vi text, ai_review_en text,
  install_command text,                                 -- 복붙용 설치 명령
  rank_score numeric, status text,                      -- visible|hidden|pending_analysis|failed
  is_official bool, created_at, updated_at
)
skill_translations (
  skill_id fk, locale text,                             -- unique(skill_id, locale), ko|vi|en
  name text, one_liner text, description_md text,       -- 해설 본문(활용 예시 포함)
  install_guide_md text
)
skill_metrics_daily ( skill_id fk, date, stars )        -- 트렌딩 계산용 스냅샷
collections ( id, slug, is_pinned bool, skill_ids uuid[], created_at )
collection_translations ( collection_id fk, locale, title, description )
pipeline_runs ( id, started_at, finished_at, discovered int, analyzed int,
                published int, errors int, cost_usd numeric, notes text )

-- 유저 (RLS: 본인 행만 쓰기, 읽기는 공개)
profiles ( id uuid pk = auth.uid(), nickname text )
favorites ( user_id fk, skill_id fk, created_at )       -- unique(user_id, skill_id)
ratings ( user_id fk, skill_id fk, stars int check 1..5,
          comment text, created_at )                    -- unique(user_id, skill_id)
```

카테고리 고정 분류(12): 문서·오피스 / 개발·코딩 / 디자인·UI / 마케팅·SEO / 콘텐츠·글쓰기 / 이미지·영상 / 데이터·분석 / 자동화·워크플로 / 웹·API 연동 / 보안·리뷰 / 교육·학습 / 유틸리티. 분류 기준은 파이프라인 프롬프트에 정의하며, 분류 변경은 마이그레이션으로 취급한다.

## 8. 다국어

- 라우팅: `/ko`, `/vi`, `/en` (next-intl). 루트 접속 시 브라우저 언어로 리다이렉트, 기본값 `ko`
- UI 문자열: next-intl 메시지 파일 3종 (개발 시 ko 작성 → Claude로 vi/en 생성)
- 콘텐츠: `skill_translations`에서 로케일로 조회. 특정 언어 번역이 없으면 en → 원문 순 폴백
- SEO: 언어별 메타태그, hreflang, sitemap

## 9. 화면 구성과 UI

### 화면 (6)
| 화면 | 경로 | 내용 |
|---|---|---|
| 홈 | `/[locale]` | 검색바, 트렌딩, 카테고리 그리드, 추천 컬렉션 카드, 신규 스킬 |
| 스킬 목록 | `/[locale]/skills` | 카테고리·난이도·공식여부 필터, 정렬(인기순 rank/최신순/트렌딩) |
| 스킬 상세 | `/[locale]/skills/[slug]` | 이름·한줄요약·별점·즐겨찾기 → AI 한줄평 → 해설·활용 예시 → 설치 가이드(복사 버튼) → GitHub 지표·원본 링크·라이선스 → 리뷰 목록 |
| 컬렉션 상세 | `/[locale]/collections/[slug]` | 상황 설명 + 스킬 세트 |
| 시작 가이드 | `/[locale]/guide` | "스킬이란?", "처음 설치하기" (정적, 3개 언어 수동 작성) |
| 마이페이지 | `/[locale]/me` | 즐겨찾기 목록, 내가 쓴 리뷰 |

### 검색
- 서버 쿼리: `skill_translations`의 name/one_liner/description에 대한 Postgres `ilike` + 카테고리 필터. 수천 개 규모까지 충분하며, 느려지면 pg full-text search로 교체(스키마 변경 없이 인덱스 추가)

### UI 방향
- Claude.ai 감성: 크림/오프화이트 배경, 테라코타 포인트, 넉넉한 여백, 둥근 모서리, 세리프 헤딩, 다크모드(시스템 연동)
- 모바일 퍼스트 = 좁은 창 대응: 375px 기준 레이아웃이 Claude Code 옆 좁은 창에서 그대로 동작, 768px 이상에서 그리드 확장
- 푸터에 3개 언어로 고지: "비공식 서비스이며 Anthropic과 무관합니다" (상표 리스크 완화)

## 10. 회원 기능

- Supabase Auth, 구글 OAuth 1개로 시작 (카카오는 회원 기능 사용률 검증 후)
- 즐겨찾기: 토글, 로그인 안 한 상태에서 누르면 로그인 유도
- 별점·리뷰: 유저당 스킬 1개(수정 가능), 평균 별점은 조회 시 집계
- RLS: favorites/ratings는 본인 행만 insert/update/delete, select는 공개. profiles는 본인만 쓰기
- 실패 UX: 뮤테이션 실패 시 토스트 + 낙관적 업데이트 롤백

## 11. 기술 스택 확정

| 영역 | 선택 | 비고 |
|---|---|---|
| 웹 | Next.js(App Router) + TypeScript | Vercel 배포, ISR revalidate 1시간 |
| DB·인증 | Supabase (이미 연결됨) | 웹은 anon key+RLS, 파이프라인은 service_role |
| i18n | next-intl | /ko /vi /en |
| 파이프라인 | TypeScript + GitHub Actions cron | `@anthropic-ai/sdk`, Batch API |
| AI 모델 | `claude-opus-5` (구조화 출력) | 하위 모델 전환은 실측 후 운영자 결정 |
| 스타일 | Tailwind CSS | 다크모드 class 전략 |
| 도메인 | 오픈 전 결정 | 개발 중 Vercel 기본 도메인 사용 |

환경 변수: `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(파이프라인) / `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`(웹).

## 12. 빌드 마일스톤

1. **M1 — 파이프라인 v1**: DB 스키마 + 발굴→선별→분석·번역→배포 전 과정을 소량(50개)으로 엔드투엔드 검증. 산출물 품질을 눈으로 확인
2. **M2 — 웹 코어**: 홈·목록·상세·검색, 3개 언어 라우팅, Claude 감성 UI
3. **M3 — 가동**: 백필 전체 실행 + 일일 cron 가동 + 컬렉션 생성 + 트렌딩
4. **M4 — 회원·마무리**: 로그인·즐겨찾기·평점, 시작 가이드, SEO, 도메인 연결·오픈

파이프라인을 먼저 만드는 이유: 콘텐츠가 곧 제품이고, 실제 파이프라인 출력을 보며 UI를 다듬는 순서가 재작업이 없다.

## 13. 운영·모니터링

- 매 런을 `pipeline_runs`에 기록(처리 건수, 오류 수, 비용)
- 실패 알림: GitHub Actions 실패 시 기본 이메일 알림 활용 (별도 알림 인프라 없음)
- 운영 작업(스킬 강제 숨김, 컬렉션 고정 등)은 Supabase 대시보드/SQL로 수행 — 관리자 UI 없음

## 14. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| GitHub 검색 API 제한·누락 | 시드 저장소 우선 + 검색은 보조. 런당 상한과 이월로 점진 수집 |
| AI 번역·평가 품질 | 구조화 출력으로 형식 보장, 루브릭 명시. 오픈 전 M1에서 샘플 50개 육안 검수 후 프롬프트 보정 |
| 비용 폭주 | 변경 해시 기반 델타 처리, 런당 1,000건 상한, Batch API, 런별 비용 기록 |
| 상표(클로드 명칭) | 비공식 고지 문구. 로고·브랜드 자산 미사용. 문제 제기 시 서비스명 변경 여지 인지 |
| 스킬 원문 라이선스 | 원문 전문 재게시 대신 요약·해설 중심 + 원본 링크. 라이선스 필드 표시 |
| 악성 스킬(프롬프트 인젝션 등) | AI 평가 루브릭에 위험 신호 감점 포함, 신고 링크(메일) 제공. 완전한 검증은 비목표로 명시 |

## 15. 로드맵 (MVP 이후)

커뮤니티 제출 → 크롬 확장프로그램 → 앱 → 수익화(검증 후 모델 결정) → 언어 추가. 각 단계는 별도 스펙으로 다룬다.

## 16. 테스트 전략 (최소)

- 파이프라인: 선별·스코어링 로직 단위 테스트 1파일, 구조화 출력 스키마는 API가 보장
- 웹: 빌드 통과 + 핵심 3페이지(홈/목록/상세) 스모크
- M1의 "50개 육안 검수"가 실질적 품질 게이트
