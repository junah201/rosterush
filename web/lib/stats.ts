import type { Difficulty, Lang, LatestStats } from "@rosterush/core";

/** 집계 결과(latest.json). 아직 집계 전이거나 실패하면 null */
export async function fetchLatestStats(
  game: string,
  lang: Lang,
  difficulty: Difficulty,
): Promise<LatestStats | null> {
  try {
    const res = await fetch(`/stats/${game}/${lang}/${difficulty}/latest.json`);
    if (!res.ok) return null;
    return (await res.json()) as LatestStats;
  } catch {
    return null;
  }
}
