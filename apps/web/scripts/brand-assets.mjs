/**
 * 파비콘·OG 이미지 생성. `node scripts/brand-assets.mjs` (apps/web에서 실행)
 *
 * 디자인: 매대 영수증 슬립(아래가 찢긴 종이)을 Linear 다크 시스템 위에 올린다.
 * 동적 OG(lib/og.tsx)와 같은 팔레트·같은 구조 — 정적/동적 미리보기가 한 식구로 보인다.
 * 서체는 영수증이라는 "인쇄물"의 것: 한글 명조(AppleMyungjo) + 모노.
 * sharp(librsvg)는 시스템 폰트만 쓰므로 웹폰트는 지정하지 않는다.
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

/* Linear 팔레트 (DESIGN.md / globals.css와 수동 동기화) */
const COUNTER = "#18191a"; // 카운터(배경) — surface-3
const PAPER = "#0f1011";   // 영수증 패널 — surface-1 (다크 종이)
const INK = "#f7f8f8";
const INK_SOFT = "#8a8f98";
const LAVENDER = "#828fff"; // 근검정 위에서는 primary가 어두워 hover 라벤더
const LINE = "#23252a";

const SERIF_KR = "AppleMyungjo, 'Apple SD Gothic Neo', serif";
const MONO = "'SF Mono', Menlo, monospace";

/** 아래가 찢긴 영수증 경로. teeth = 톱니 수 */
function receiptPath(x, y, w, h, toothH, teeth) {
  const step = w / teeth;
  let d = `M${x} ${y} H${x + w} V${y + h - toothH} `;
  for (let i = 0; i < teeth; i++) {
    const left = x + w - i * step;
    d += `L${left - step / 2} ${y + h} L${left - step} ${y + h - toothH} `;
  }
  return `${d}Z`;
}

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${COUNTER}"/>
  <path d="${receiptPath(90, 58, 1020, 494, 26, 17)}" fill="${PAPER}" stroke="${LINE}" stroke-width="2"/>

  <text x="150" y="152" font-family="${MONO}" font-size="26" letter-spacing="4" fill="${LAVENDER}">· · ·  오늘의 매대  · · ·</text>

  <text x="150" y="290" font-family="${SERIF_KR}" font-size="118" fill="${INK}">AI 스킬마트</text>

  <text x="152" y="368" font-family="${SERIF_KR}" font-size="40" fill="${INK_SOFT}">AI 스킬·명령어, 매일 골라 한국어로</text>

  <line x1="150" y1="428" x2="1050" y2="428" stroke="${LINE}" stroke-width="3" stroke-dasharray="9 9"/>

  <text x="150" y="482" font-family="${MONO}" font-size="30" fill="${LAVENDER}">skillmart.dev</text>
  <text x="1050" y="482" text-anchor="end" font-family="${MONO}" font-size="26" fill="${INK_SOFT}">한국어 · Tiếng Việt · English</text>
</svg>`;

await sharp(Buffer.from(og)).png().toFile("app/opengraph-image.png");

// 애플 터치 아이콘: iOS가 자체로 모서리를 깎으므로 라운딩 없이 타일을 꽉 채운다.
const appleSvg = readFileSync("app/icon.svg", "utf8")
  .replace(' rx="7"', "")
  .replace(' rx="6.5"', "");
await sharp(Buffer.from(appleSvg)).resize(180, 180).png().toFile("app/apple-icon.png");

// 16px 판독 검수용 (커밋하지 않는다)
await sharp(readFileSync("app/icon.svg")).resize(16, 16).png().toFile("/tmp/icon-16.png");
await sharp(readFileSync("app/icon.svg")).resize(64, 64).png().toFile("/tmp/icon-64.png");

console.log("생성: app/opengraph-image.png, app/apple-icon.png (검수용 /tmp/icon-16.png, /tmp/icon-64.png)");
