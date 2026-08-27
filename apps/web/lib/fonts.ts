import { Inter, JetBrains_Mono } from "next/font/google";

/* 한국어 웹폰트(Gowun Batang·IBM Plex Sans KR)를 제거했다.
 * 실측 결과 둘이 파일 202개·약 2.3MB를 내려받으면서 한글을 한 글자도 그리지 않았다 —
 * subsets: ["latin"]로 선언돼 한글 글리프가 없는데 preload 태그가 전체 서브셋을 강제로 받았다.
 * 한글은 스택 끝의 시스템 폰트(명조/고딕)가 그린다. 지운 뒤에도 화면은 같다.
 * 다시 넣을 거면 subsets에 "korean"을 넣고 preload: false로 지연 로드할 것. */

/* Linear의 커스텀 서체는 배포되지 않는다. DESIGN.md가 직접 지목한 무료 대체가 Inter다
 * ("Inter at weight 500/600/700 is the closest free substitute").
 * Linear는 Display와 Text를 한 목소리로 쓰므로 제목·본문 모두 이 하나로 간다. */
export const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

/* DESIGN.md 권장 mono 대체. 코드 맥락에서만 쓴다. */
export const mono = JetBrains_Mono({
  weight: ["400", "600"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-mono",
});
