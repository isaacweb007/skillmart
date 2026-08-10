"use client";

import { useEffect, useRef, useState } from "react";

/** 클릭하면 자기 텍스트를 복사하는 칩. 라벨을 그대로 유지하고 ✓만 덧붙인다
 *  (라벨을 "복사됨"으로 바꾸면 어떤 명령어였는지 사라진다). */
export default function CopyChip({ text, title }: { text: string; title: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <button
      type="button"
      title={title}
      aria-label={`${title}: ${text}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setDone(false), 1500);
        } catch {
          // 클립보드 권한 거부 등 — 조용히 무시 (수동 선택 복사 가능)
        }
      }}
      className={`rounded-md px-2 py-0.5 font-mono-plex text-xs transition-colors ${
        done ? "bg-accent text-accent-ink" : "bg-bg text-accent hover:bg-line"
      }`}
    >
      {text}
      {done ? " ✓" : ""}
    </button>
  );
}
