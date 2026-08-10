import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";

/* 한국어 웹폰트(Gowun Batang·IBM Plex Sans KR)를 제거했다.
 * 실측 결과 둘이 파일 202개·약 2.3MB를 내려받으면서 한글을 한 글자도 그리지 않았다 —
 * subsets: ["latin"]로 선언돼 한글 글리프가 없는데 preload 태그가 전체 서브셋을 강제로 받았다.
 * 한글은 스택 끝의 시스템 폰트(명조/고딕)가 그린다. 지운 뒤에도 화면은 같다.
 * 다시 넣을 거면 subsets에 "korean"을 넣고 preload: false로 지연 로드할 것. */

export const sourceSerif = Source_Serif_4({
  subsets: ["latin", "vietnamese"],
  variable: "--font-source-serif",
});

export const plex = IBM_Plex_Sans({
  weight: ["400", "600"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-plex",
});

export const plexMono = IBM_Plex_Mono({
  weight: ["400", "600"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-mono-plex",
});
