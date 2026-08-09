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
