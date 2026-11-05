import { type Difficulty, type Lang, type LatestStats, topPercent } from "@rosterush/core";
import { useEffect, useState } from "react";

/** 집계 결과(latest.json). 아직 집계 전이거나 실패하면 null */
async function fetchLatestStats(
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

/**
 * 같은 (게임, 언어, 난이도)는 페이지에서 한 번만 불러온다 (댓글마다 기록 카드가 있어서).
 * 받지 못했으면(null) 캐시에서 빼서 다음에 다시 시도한다.
 */
function latestStatsOnce(
  game: string,
  lang: Lang,
  difficulty: Difficulty,
): Promise<LatestStats | null> {
  const key = `${game}/${lang}/${difficulty}`;
  let p = cache.get(key);
  if (!p) {
    p = fetchLatestStats(game, lang, difficulty).then((s) => {
      if (!s) cache.delete(key);
      return s;
    });
    cache.set(key, p);
  }
  return p;
}

/**
 * 집계 결과를 불러온다. undefined = 불러오는 중 (또는 enabled가 false), null = 집계 없음.
 * @param enabled false면 불러오지 않는다 (예: 완주가 아니라 순위가 필요 없을 때)
 */
export function useLatestStats(
  game: string,
  lang: Lang,
  difficulty: Difficulty,
  enabled = true,
): LatestStats | null | undefined {
  const key = `${game}/${lang}/${difficulty}`;
  const [loaded, setLoaded] = useState<{ key: string; stats: LatestStats | null } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    latestStatsOnce(game, lang, difficulty).then((stats) => alive && setLoaded({ key, stats }));
    return () => {
      alive = false;
    };
  }, [enabled, key, game, lang, difficulty]);

  // 키가 바뀐 직후에는 이전 키의 결과를 보여주지 않는다
  return enabled && loaded?.key === key ? loaded.stats : undefined;
}

/** 완주 기록의 현재 순위. 계산할 수 없으면 그 이유 */
export type Rank =
  | { kind: "top"; top: number; n: number }
  /** 아직 집계 전 */
  | { kind: "pending" }
  /** 기록 이후 캐릭터가 추가됨 */
  | { kind: "rosterChanged" }
  /** 표본이 부족함 */
  | { kind: "collecting"; n: number; min: number };

export function rankOf(totalMs: number, rosterVer: number, stats: LatestStats | null): Rank {
  if (!stats) return { kind: "pending" };
  if (stats.rosterVer !== rosterVer) return { kind: "rosterChanged" };
  const top = topPercent(totalMs, stats.clearTime);
  if (top === null) return { kind: "collecting", n: stats.clearTime.n, min: stats.minSample };
  return { kind: "top", top, n: stats.clearTime.n };
}
