export default function Loading() {
  return (
    <div className="grid gap-3 py-10 sm:grid-cols-2" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl border border-line bg-surface" />
      ))}
    </div>
  );
}
