export function trendingDelta(
  snapshots: { date: string; stars: number }[],
  todayStars: number,
  today: string,
): number {
  const cutoff = new Date(new Date(`${today}T00:00:00Z`).getTime() - 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const base = snapshots
    .filter((s) => s.date <= cutoff)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return base ? todayStars - base.stars : 0;
}
