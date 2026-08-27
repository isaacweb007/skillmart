export default function Chip({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      /* Linear는 pill을 쓰지 않는다 — 카드·칩 모두 작은 각진 모서리다 */
      className={`inline-block whitespace-nowrap rounded-md border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-accent bg-accent text-accent-ink"
          : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
      }`}
    >
      {children}
    </span>
  );
}
