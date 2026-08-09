/**
 * 파비콘·OG 이미지 생성. `node scripts/brand-assets.mjs` (apps/web에서 실행)
 *
 * 디자인: 사이트 설치 블록의 "영수증"(점선 테두리·모노 활자)을 브랜드 마크로 확장한다.
 * 매대에서 스킬을 골라 받는 영수증 — 아래가 찢긴 종이 실루엣이 파비콘·OG 공통 장치.
 * 색은 globals.css 라이트 모드 토큰 그대로. 링크 미리보기 카드는 대개 밝은 배경이라 라이트 고정.
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

const PAPER = "#faf9f5";
const SURFACE = "#e9e5db";  // 카운터(배경) — 영수증이 도드라지게 종이보다 어둡게
const PAPER_CARD = "#fdfcf9"; // 갓 받은 영수증
const INK = "#33302a";
const INK_SOFT = "#6e6858";
const TERRA = "#c15f3c";
const LINE = "#e3dfd3";

// 한글은 AppleMyungjo(명조) — 사이트 디스플레이 Gowun Batang과 같은 계열.
// 라틴은 Georgia. sharp(librsvg)는 시스템 폰트만 쓰므로 웹폰트는 지정하지 않는다.
const SERIF_KR = "AppleMyungjo, 'Apple SD Gothic Neo', serif";
const SERIF = "Georgia, 'Times New Roman', serif";
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
  <rect width="1200" height="630" fill="${SURFACE}"/>
  <path d="${receiptPath(90, 58, 1020, 494, 26, 17)}" fill="${PAPER_CARD}"/>

  <text x="150" y="152" font-family="${MONO}" font-size="26" letter-spacing="4" fill="${TERRA}">· · ·  오늘의 매대  · · ·</text>

  <text x="150" y="290" font-family="${SERIF_KR}" font-size="112" fill="${INK}">클로드스킬마트</text>

  <text x="152" y="368" font-family="${SERIF_KR}" font-size="40" fill="${INK_SOFT}">Claude Code 스킬, 매일 골라 한국어로</text>

  <line x1="150" y1="428" x2="1050" y2="428" stroke="${LINE}" stroke-width="3" stroke-dasharray="9 9"/>

  <text x="150" y="482" font-family="${MONO}" font-size="30" fill="${TERRA}">skillmart.dev</text>
  <text x="1050" y="482" text-anchor="end" font-family="${MONO}" font-size="26" fill="${INK_SOFT}">한국어 · Tiếng Việt · English</text>
</svg>`;

await sharp(Buffer.from(og)).png().toFile("app/opengraph-image.png");

// 애플 터치 아이콘: iOS가 자체로 모서리를 깎으므로 라운딩 없이 타일을 꽉 채운다.
// (rx가 남으면 투명 모서리가 홈 화면에서 검게 비친다)
const appleSvg = readFileSync("app/icon.svg", "utf8").replace(' rx="7"', "");
await sharp(Buffer.from(appleSvg)).resize(180, 180).png().toFile("app/apple-icon.png");

// 16px 판독 검수용 (커밋하지 않는다)
await sharp(readFileSync("app/icon.svg")).resize(16, 16).png().toFile("/tmp/icon-16.png");
await sharp(readFileSync("app/icon.svg")).resize(64, 64).png().toFile("/tmp/icon-64.png");

console.log("생성: app/opengraph-image.png, app/apple-icon.png (검수용 /tmp/icon-16.png, /tmp/icon-64.png)");
