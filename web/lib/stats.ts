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

const cache = new Map<string, Promise<LatestStats | null>>();

/** 같은 (게임, 언어, 난이도)는 페이지에서 한 번만 불러온다 (댓글마다 기록 카드가 있어서) */
export function latestStatsOnce(
  game: string,
  lang: Lang,
  difficulty: Difficulty,
): Promise<LatestStats | null> {
  const key = `${game}/${lang}/${difficulty}`;
  let p = cache.get(key);
  if (!p) {
    p = fetchLatestStats(game, lang, difficulty);
    cache.set(key, p);
  }
  return p;
}
