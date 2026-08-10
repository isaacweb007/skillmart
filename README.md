# 클로드스킬마트 · Claude Skill Mart

**[skillmart.dev](https://skillmart.dev)** — AI가 매일 GitHub에서 Claude Code 스킬을 발굴해 한국어·베트남어·영어로 풀어쓰는 스킬 안내소.

터미널을 쓰지 않는 사람도 **ZIP 하나 받아 Claude 앱에 올리면** 설치가 끝납니다.

- 🇰🇷 [한국어](https://skillmart.dev/ko) · 🇻🇳 [Tiếng Việt](https://skillmart.dev/vi) · 🇬🇧 [English](https://skillmart.dev/en)
- 스킬이 뭔지 모르겠다면 → [스킬이 뭐예요?](https://skillmart.dev/ko/guide)

## 무엇을 하는 서비스인가

Claude Code 스킬은 GitHub 곳곳에 흩어져 있고, 대부분 영어로 적혀 있으며, 설치 방법은 `git clone`으로 시작합니다. 개발자가 아니면 여기서 멈춥니다.

이 사이트는 그 세 가지를 없앱니다.

| 문제 | 이 사이트가 하는 일 |
|---|---|
| 흩어져 있다 | 매일 새벽 GitHub을 훑어 SKILL.md를 모은다 |
| 영어로 적혀 있다 | 무엇을 해주는 스킬인지 3개 언어로 풀어쓴다 |
| 설치가 어렵다 | 스킬 폴더를 ZIP으로 만들어 준다. Claude 앱 설정에 올리면 끝 |
| 뭘 골라야 할지 모른다 | AI가 품질을 채점하고, "발표 자료 만드는 날" 같은 세트로 묶는다 |

## 어떻게 만들어졌나

```
GitHub 발굴 → 선별 → Claude Batch 분석·3개 언어 번역 → Supabase 발행 → 웹
     (매일 새벽 3시, GitHub Actions cron)
```

- **파이프라인** (`pipeline/`) — GitHub 검색으로 저장소를 찾고, 저장소를 돌아가며 후보를 고르고(라운드로빈), Claude Batch API로 분석·번역해 Supabase에 발행합니다. 하루 지출 상한이 걸려 있습니다.
- **웹** (`apps/web/`) — Next.js 15 · Tailwind v4 · next-intl. 3개 언어 라우팅, ISR 캐시, 스킬별·언어별 OG 이미지 동적 생성.
- **DB** (`supabase/`) — Postgres + RLS. 스킬·번역·컬렉션·일일 지표.

## 직접 돌려보기

```bash
npm install
cp .env.example .env        # 키를 채운다
npm run --workspace pipeline start -- --limit 5 --max-cost 1
```

웹만 띄우려면:

```bash
npm run dev -w web          # apps/web/.env.local 에 Supabase 키 필요
```

## 스킬 저작자에게

이 사이트는 GitHub 공개 저장소의 SKILL.md를 안내하고 원본 저장소로 링크합니다. 스킬 자체를 재배포하지 않으며, 내려가길 원하시면 이슈를 남겨주세요 — 바로 처리합니다.

## 라이선스

이 저장소의 코드는 MIT. 소개하는 스킬들은 각자의 원본 저장소 라이선스를 따릅니다.

---

*비공식 서비스이며 Anthropic과 무관합니다.*
