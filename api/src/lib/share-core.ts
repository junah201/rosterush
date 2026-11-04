import {
  type EndReason,
  type GameDef,
  type LatestStats,
  type ResultKey,
  rosterAt,
  type ShareView,
  type Solves,
  topPercent,
} from "@rosterush/core";

/** results 테이블에서 공유에 필요한 필드 */
export type StoredResult = {
  rosterVer: number;
  endReason: EndReason;
  totalMs: number;
  solves: Solves;
  flagged?: boolean;
  shareId?: string;
};

/** shares 테이블 아이템 (resultId 포함, 응답으로는 ShareView만 노출) */
export type ShareItem = Omit<ShareView, "createdAt" | "nickname"> & {
  resultId: string;
  nickname?: string;
  createdAt: number;
};

/**
 * 공유 시점의 백분위 스냅샷.
 * 완주 기록이고, 집계의 로스터 버전이 기록과 같고, 표본이 충분할 때만 값이 있다.
 */
export function snapshotPercentile(
  result: StoredResult,
  stats: LatestStats | null,
): { percentile: number | null; aggVersion: string | null } {
  if (!stats || result.endReason !== "clear" || stats.rosterVer !== result.rosterVer)
    return { percentile: null, aggVersion: null };
  const percentile = topPercent(result.totalMs, stats.clearTime);
  return { percentile, aggVersion: percentile === null ? null : stats.aggVersion };
}

export function buildShareItem(opts: {
  shareId: string;
  resultId: string;
  key: ResultKey;
  game: GameDef;
  result: StoredResult;
  stats: LatestStats | null;
  nickname?: string;
  now: number;
}): ShareItem {
  const { shareId, resultId, key, game, result, stats, nickname, now } = opts;
  return {
    shareId,
    resultId,
    game: key.game,
    lang: key.lang,
    difficulty: key.difficulty,
    rosterVer: result.rosterVer,
    endReason: result.endReason,
    totalMs: result.totalMs,
    solved: Object.keys(result.solves).length,
    total: rosterAt(game, result.rosterVer).length,
    solves: result.solves,
    ...snapshotPercentile(result, stats),
    ...(nickname ? { nickname } : {}),
    createdAt: Math.floor(now / 1000),
  };
}

/** 저장 아이템 → 공개 응답 (resultId 제거) */
export function toShareView(item: ShareItem): ShareView {
  const { resultId: _secret, nickname, createdAt, ...rest } = item;
  return {
    ...rest,
    nickname: nickname ?? null,
    createdAt: new Date(createdAt * 1000).toISOString(),
  };
}
