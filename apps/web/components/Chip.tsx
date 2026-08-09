export default function Chip({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
        active
          ? "border-accent bg-accent text-accent-ink"
          : "border-line bg-surface text-ink-soft"
      }`}
    >
      {children}
    </span>
  );
}
