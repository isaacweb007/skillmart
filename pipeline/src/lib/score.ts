export function rankScore(
  aiScore: number | null,
  stars: number,
  lastCommitAt: string | null,
  now: Date = new Date(),
): number {
  const quality = (aiScore ?? 0) / 10;
  const popularity = Math.min(Math.log10(stars + 1) / 4, 1);
  let recency = 0;
  if (lastCommitAt) {
    const days = (now.getTime() - new Date(lastCommitAt).getTime()) / 86_400_000;
    recency = Math.max(0, 1 - days / 180);
  }
  return Number((0.5 * quality + 0.3 * popularity + 0.2 * recency).toFixed(4));
}

export function isVisible(aiScore: number | null, isOfficial: boolean): boolean {
  return isOfficial || (aiScore !== null && aiScore >= 5);
}

export function needsAnalysis(
  existing: { content_hash: string; status: string } | undefined,
  newHash: string,
): boolean {
  if (!existing) return true;
  if (existing.content_hash !== newHash) return true;
  return existing.status === "pending_analysis";
}

export function nextStatus(
  ok: boolean,
  aiScore: number | null,
  isOfficial: boolean,
  prevAttempts: number,
): { status: "visible" | "hidden" | "pending_analysis" | "failed"; attempts: number } {
  if (ok) return { status: isVisible(aiScore, isOfficial) ? "visible" : "hidden", attempts: 0 };
  const attempts = prevAttempts + 1;
  return { status: attempts >= 3 ? "failed" : "pending_analysis", attempts };
}
