import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_FONT_FAMILY = "Gowun";

const PAPER = "#fdfcf9";
const COUNTER = "#e9e5db";
const INK = "#33302a";
const INK_SOFT = "#6e6858";
const TERRA = "#c15f3c";
const LINE = "#e3dfd3";

/** 아래가 찢긴 영수증 배경. satori는 SVG 요소를 직접 그리지 못해 data URI 이미지로 넣는다. */
function receiptBackground(): string {
  const x = 90;
  const y = 58;
  const w = 1020;
  const h = 494;
  const toothH = 26;
  const teeth = 17;
  const step = w / teeth;
  let d = `M${x} ${y} H${x + w} V${y + h - toothH} `;
  for (let i = 0; i < teeth; i++) {
    const left = x + w - i * step;
    d += `L${left - step / 2} ${y + h} L${left - step} ${y + h - toothH} `;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="${COUNTER}"/><path d="${d}Z" fill="${PAPER}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Gowun Batang(사이트 디스플레이 폰트) 하나로 한글·베트남어·라틴을 모두 덮는다.
 *  satori는 가변 폰트를 파싱하지 못한다(Source Serif 4 가변본에서 TypeError) — 정적 TTF만 쓸 것. */
export async function ogFonts() {
  const data = await readFile(join(process.cwd(), "assets", "fonts", "GowunBatang-Regular.ttf"));
  return [{ name: OG_FONT_FAMILY, data, style: "normal" as const, weight: 400 as const }];
}

/** 글자 수로 자른다 — satori에는 말줄임(ellipsis)이 없어 넘치면 하단과 겹친다 */
export function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** "한글 이름 (english-slug)" 형태의 제목에서 괄호 꼬리를 떼어 큰 활자를 깨끗하게 만든다.
 *  슬러그는 공유되는 URL에 이미 보인다. */
export function ogTitle(name: string): string {
  const stripped = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return clip(stripped || name, 28);
}

export interface ReceiptProps {
  eyebrow: string;
  title: string;
  line: string;
  footerRight: string;
}

/** 사이트 OG·스킬 OG 공용 영수증 레이아웃.
 *  본문과 푸터를 한 컬럼의 space-between으로 묶어, 제목이 길어져도 푸터를 밀어내지 않는다. */
export function OgReceipt({ eyebrow, title, line, footerRight }: ReceiptProps) {
  const titleSize = title.length > 20 ? 58 : title.length > 12 ? 76 : 96;
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "1200px",
        height: "630px",
        fontFamily: OG_FONT_FAMILY,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={receiptBackground()}
        alt=""
        width={1200}
        height={630}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "absolute",
          top: "100px",
          left: "150px",
          width: "900px",
          height: "394px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "26px", color: TERRA, letterSpacing: "4px" }}>
            · · · {eyebrow} · · ·
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "30px",
              fontSize: `${titleSize}px`,
              color: INK,
              lineHeight: 1.18,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "20px",
              fontSize: "34px",
              color: INK_SOFT,
              lineHeight: 1.4,
            }}
          >
            {line}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: "900px", borderTop: `3px dashed ${LINE}` }} />
          <div
            style={{
              display: "flex",
              marginTop: "26px",
              width: "900px",
              justifyContent: "space-between",
              fontSize: "28px",
            }}
          >
            <div style={{ display: "flex", color: TERRA }}>skillmart.dev</div>
            <div style={{ display: "flex", color: INK_SOFT }}>{footerRight}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
