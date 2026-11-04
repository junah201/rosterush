import { binOf, type ClearTime, HIST_BINS, histToClearTime } from "./percentile";
import type { Difficulty, EndReason, Lang, Run } from "./types";

export type CharacterSums = {
  n: number;
  found: number;
  first: number;
  rankSum: number;
  msSum: number;
};

/** 집계 Lambda 전용 누적 상태 (합칠 수 있는 개수와 합계만 저장) */
export type AggState = {
  schema: 1;
  since: string;
  /** 여기까지 집계 완료 (ULID) */
  cursor: string | null;
  runs: { total: number } & Record<EndReason, number>;
  /** rosterVer → 1초 단위 완주 시간 히스토그램 */
  clearHist: Record<string, { n: number; bins: number[] }>;
  characters: Record<string, CharacterSums>;
};

export type CharacterStat = { n: number; found: number; rank: number; ms: number; first: number };

/** 공개용 latest.json */
export type LatestStats = {
  schema: 1;
  game: string;
  lang: Lang;
  difficulty: Difficulty;
  aggVersion: string;
  since: string;
  rosterVer: number;
  minSample: number;
  runs: AggState["runs"];
  clearTime: ClearTime;
  characters: Record<string, CharacterStat> | null;
};

export function emptyState(since: string): AggState {
  return {
    schema: 1,
    since,
    cursor: null,
    runs: { total: 0, clear: 0, giveup: 0, timeout: 0 },
    clearHist: {},
    characters: {},
  };
}

/** 기록 하나를 상태에 더한다. roster = 그 기록의 rosterVer 기준 캐릭터 id 목록 */
export function addRun(state: AggState, run: Run, roster: readonly string[]): void {
  state.runs.total++;
  state.runs[run.endReason]++;

  if (run.endReason === "clear") {
    const key = String(run.rosterVer);
    state.clearHist[key] ??= { n: 0, bins: Array<number>(HIST_BINS).fill(0) };
    const h = state.clearHist[key];
    h.bins[binOf(run.totalMs)] = (h.bins[binOf(run.totalMs)] ?? 0) + 1;
    h.n++;
  }

  const order = Object.entries(run.solves).sort((a, b) => a[1] - b[1]);
  const last = order.length - 1;
  const rankOf = new Map(order.map(([id], i) => [id, last > 0 ? i / last : 0]));
  const firstId = order[0]?.[0];

  for (const id of roster) {
    state.characters[id] ??= { n: 0, found: 0, first: 0, rankSum: 0, msSum: 0 };
    const c = state.characters[id];
    c.n++;
    const ms = run.solves[id];
    if (ms === undefined) continue;
    c.found++;
    c.rankSum += rankOf.get(id) ?? 0;
    c.msSum += ms;
    if (firstId === id) c.first++;
  }
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;

export function toLatest(
  state: AggState,
  meta: { game: string; lang: Lang; difficulty: Difficulty; aggVersion: string; rosterVer: number },
  minSample = 100,
): LatestStats {
  const bins = state.clearHist[String(meta.rosterVer)]?.bins ?? [];
  const characters =
    state.runs.total < minSample
      ? null
      : Object.fromEntries(
          Object.entries(state.characters).map(([id, c]) => [
            id,
            {
              n: c.n,
              found: r3(c.n ? c.found / c.n : 0),
              rank: r3(c.found ? c.rankSum / c.found : 0),
              ms: Math.round(c.found ? c.msSum / c.found : 0),
              first: r3(c.n ? c.first / c.n : 0),
            },
          ]),
        );

  return {
    schema: 1,
    ...meta,
    since: state.since,
    minSample,
    runs: state.runs,
    clearTime: histToClearTime(bins, minSample),
    characters,
  };
}
