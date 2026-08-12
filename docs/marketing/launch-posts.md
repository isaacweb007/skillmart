# 클로드스킬마트 채널별 소개 글

작성 기준 수치 (2026-08-12 실측): 스킬 **593개** · 저장소 **118곳** · 번역 **1,833행** · 추천 세트 **10개** · 3개 언어

> 게시 전 확인: 수치는 매일 늘어난다. 하루 이상 지나면 https://skillmart.dev/ko 홈에 표시된 숫자로 바꿔서 올려라.

---

## 1. GeekNews (news.hada.io)

**주소**: https://news.hada.io/new — "제출하기"
**URL 칸**: `https://skillmart.dev/ko`

### 제목
```
클로드스킬마트 - Claude Code 스킬을 매일 발굴해 한국어로 풀어쓰는 안내소
```

### 본문
```
Claude Code 스킬(SKILL.md)이 GitHub 곳곳에 흩어져 있는데, 대부분 영어로 적혀 있고 설치 안내가 git clone으로 시작합니다. 개발자가 아니면 여기서 막힙니다. 그 세 가지를 없애보려고 만들었습니다.

매일 새벽 3시에 GitHub Actions가 돌면서:
- 저장소를 훑어 SKILL.md를 수집 (현재 118개 저장소, 593개 스킬)
- Claude Batch API로 무엇을 해주는 스킬인지 분석하고 한국어·베트남어·영어로 번역
- 품질 점수를 매겨 낮은 것은 숨김 처리
- 주간으로 "발표 자료 만드는 날" 같은 세트를 자동 구성

터미널을 안 쓰는 사람을 위해 스킬 폴더를 ZIP으로 만들어주는 라우트를 붙였습니다. Claude 데스크톱/웹 설정에 그 ZIP을 올리면 설치가 끝납니다. Claude Code 쓰는 분에게는 붙여넣으면 알아서 설치하는 한글 프롬프트를 줍니다.

기술 스택은 Next.js 15 + Supabase + Claude Batch API이고, 발굴 단계에서 겪은 문제 하나가 재미있었습니다. 처음엔 저장소를 순서대로 깊이 우선으로 훑었더니 SKILL.md가 수백 개인 메가레포 하나가 후보 예산을 독점해서, 500여 개 스킬이 저장소 10곳에서만 나왔습니다. 저장소를 돌아가며 하나씩 담는 방식으로 바꾸자 118곳으로 퍼졌습니다.

코드는 공개해뒀습니다: https://github.com/isaacweb007/skillmart

무료이고 로그인 없이 볼 수 있습니다. 담아두기만 Google 로그인이 필요합니다.
```

---

## 2. 디스콰이엇 (disquiet.io)

**주소**: https://disquiet.io/product/new

### 제품명
```
클로드스킬마트
```

### 한 줄 소개
```
AI가 매일 Claude 스킬을 발굴해 한국어로 풀어쓰는 안내소 — 터미널 없이 ZIP으로 설치
```

### 본문
```
■ 어떤 문제를 풀었나

Claude에 "스킬"을 설치하면 특정 작업을 훨씬 잘합니다. PPT 만들기, 문서 정리, 코드 리뷰 같은 것들이요. 문제는 이 스킬들이 GitHub에 흩어져 있고, 영어로 적혀 있고, 설치 안내가 터미널 명령어로 시작한다는 점입니다. 비개발자는 여기서 포기합니다.

■ 만든 것

매일 새벽 AI가 GitHub을 훑어 스킬을 모으고, 무엇을 해주는 것인지 한국어·베트남어·영어로 풀어씁니다. 현재 118개 저장소에서 593개.

핵심은 설치를 없앤 것입니다. 스킬 폴더를 ZIP으로 만들어주니, Claude 앱 설정에 올리기만 하면 됩니다. 터미널을 열지 않습니다.

■ 왜 3개 언어인가

한국과 베트남을 같이 보고 있습니다. 두 나라 모두 Claude 사용자가 빠르게 늘고 있는데 한국어·베트남어 자료는 거의 없습니다.

■ 지금 상태

매일 자동으로 늘어납니다. 무료이고, 나중에 광고로 운영비를 대려고 합니다. 구독료는 받지 않습니다.

https://skillmart.dev/ko
```

---

## 3. Reddit r/ClaudeAI (영어)

**주의**: 서브레딧 자기홍보 규칙을 먼저 확인하고, 본인 프로젝트임을 밝힐 것. 링크 포스트보다 텍스트 포스트가 잘 받는다.

### 제목
```
I built a browsable index of Claude Code skills — with a one-click ZIP so you can install them in the Claude app without a terminal
```

### 본문
```
Skills are one of the most useful things you can add to Claude, but finding them is a mess: SKILL.md files scattered across GitHub repos, and every install guide starts with `git clone`. If you use Claude in the desktop or web app rather than Claude Code, there's no obvious path at all.

So I built skillmart.dev. Every night a pipeline:
- crawls GitHub for SKILL.md files (currently 593 skills across 118 repos)
- uses the Claude Batch API to summarize what each skill actually does, and translates it into Korean, Vietnamese and English
- scores quality and hides the weak ones
- groups skills into sets like "the day you make slides"

The part I'm most happy with: for each skill it builds a ZIP of the skill folder on the fly, structured exactly the way the Claude app expects. You download it, drop it into Customize → Skills, done. No terminal. For Claude Code users there's a plain-language prompt you paste and Claude installs it itself.

Free, no login needed to browse. Source is open: github.com/isaacweb007/skillmart

Built it because I kept losing track of skills I wanted to try. Happy to hear what's missing — especially if a skill of yours is listed wrong, I'll fix it.

https://skillmart.dev/en
```

---

## 4. 텔레그램 / 커뮤니티 짧은 소개

### 한국어
```
Claude 스킬 찾아 헤매는 분들께 — skillmart.dev

AI가 매일 GitHub에서 Claude Code 스킬을 발굴해 한국어로 풀어쓰는 사이트를 만들었습니다. 현재 593개.

터미널 안 쓰셔도 됩니다. 스킬마다 ZIP을 만들어주니 Claude 앱 설정 → Skills에 올리면 설치 끝입니다.

무료 / 로그인 없이 열람 가능
https://skillmart.dev/ko
```

### Tiếng Việt (베트남어 — 텔레그램 주력)
```
Dành cho ai đang tìm skill cho Claude — skillmart.dev

Mình làm một trang tập hợp skill cho Claude Code: mỗi ngày AI quét GitHub, giải thích skill làm được gì rồi dịch sang tiếng Việt. Hiện có 593 skill từ 118 repo.

Không cần terminal: mỗi skill có sẵn file ZIP, bạn chỉ cần tải về rồi tải lên trong Claude (Customize → Skills) là xong.

Miễn phí, không cần đăng nhập để xem.
https://skillmart.dev/vi
```

### English (short)
```
skillmart.dev — a daily-updated index of Claude Code skills

An AI pipeline crawls GitHub every night, explains what each skill does, and translates it into Korean, Vietnamese and English. 593 skills from 118 repos right now.

No terminal needed: each skill comes with a ready-made ZIP you upload in Claude's settings.

Free, no login to browse.
https://skillmart.dev/en
```

---

## 게시 순서 (효과 순)

1. **GeekNews** — 검색에 잡히는 백링크 + 한국 개발자 유입. 화요일~목요일 오전이 노출이 좋다
2. **디스콰이엇** — 제품 페이지가 색인된다. 메이커 피드백도 얻는다
3. **Reddit** — 영어권 유입이 가장 크다. 자기홍보 규칙 확인 필수
4. **텔레그램·커뮤니티** — SEO는 0, 초기 사용자·피드백용. 베트남 쪽에 특히

## 게시 후 나에게 알려줄 것

- 어디에 올렸는지 (내가 백링크가 실제로 잡히는지 확인한다)
- 받은 피드백 중 사이트를 고쳐야 하는 것
