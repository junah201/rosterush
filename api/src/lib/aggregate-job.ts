import {
  type AggState,
  addRun,
  DIFFICULTIES,
  type Difficulty,
  emptyState,
  type GameDef,
  isKnownRosterVer,
  LANGS,
  type Lang,
  type LatestStats,
  maxUlidAt,
  type Run,
  rosterAt,
  toLatest,
  ulidDate,
} from "@rosterush/core";

/** 결과 테이블에서 읽은 기록 */
export type StoredRun = Run & { sk: string; flagged?: boolean };

/** 결과 테이블 조회: pk 하나에서 fromSk ≤ sk ≤ toSk 범위 */
export interface RunSource {
  query(pk: string, fromSk: string, toSk: string): AsyncIterable<StoredRun>;
}

/** 집계 상태(비공개)와 공개 JSON 저장소 */
export interface StatsStore {
  getState(prefix: string): Promise<AggState | null>;
  putState(prefix: string, state: AggState): Promise<void>;
  putPublic(path: string, body: LatestStats, kind: "latest" | "snapshot"): Promise<void>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** ULID 생성과 실제 쓰기 사이의 틈 때문에 최근 기록은 다음 집계로 넘긴다 */
export const SAFETY_MS = 5 * 60 * 1000;
/** 첫 집계 때 거슬러 올라갈 기간 (results TTL 30일 + 여유) */
export const FIRST_RUN_LOOKBACK_DAYS = 31;

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** from ~ to (UTC, 양 끝 포함) 날짜 목록 */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(from); t <= Date.parse(to); t += DAY_MS) out.push(isoDate(t));
  return out;
}

export type ComboResult = { prefix: string; added: number; skipped: number; total: number };

/**
 * (게임, 언어, 난이도) 하나를 증분 집계한다.
 * 1. state 읽기 → 2. cursor 이후 ~ (now - 5분) 기록을 더하기 → 3. state 저장 → 4. 공개 JSON 저장
 * state를 먼저 저장하므로 4단계가 실패해도 다음 실행에서 같은 state로 다시 만들 수 있다.
 */
export async function aggregateCombo(opts: {
  game: GameDef;
  lang: Lang;
  difficulty: Difficulty;
  now: number;
  minSample: number;
  source: RunSource;
  store: StatsStore;
}): Promise<ComboResult> {
  const { game, lang, difficulty, now, minSample, source, store } = opts;
  const prefix = `${game.id}/${lang}/${difficulty}`;
  const today = isoDate(now);

  const prev = await store.getState(prefix);
  const cursor = prev?.cursor ?? null;
  const startDate = cursor ? ulidDate(cursor) : isoDate(now - FIRST_RUN_LOOKBACK_DAYS * DAY_MS);
  const state = prev ?? emptyState(startDate);
  const upper = maxUlidAt(now - SAFETY_MS);
  const lower = cursor ?? "0".repeat(26);

  let added = 0;
  let skipped = 0;
  for (const date of dateRange(startDate, ulidDate(upper))) {
    const pk = `${game.id}#${lang}#${difficulty}#${date}`;
    for await (const run of source.query(pk, lower, upper)) {
      if (run.sk === cursor) continue; // 지난 집계에 이미 포함
      if (run.flagged || !isKnownRosterVer(game, run.rosterVer)) {
        skipped++;
        continue;
      }
      addRun(
        state,
        run,
        rosterAt(game, run.rosterVer).map((c) => c.id),
      );
      added++;
    }
  }

  state.cursor = upper;
  await store.putState(prefix, state);

  const latest = toLatest(
    state,
    { game: game.id, lang, difficulty, aggVersion: today, rosterVer: game.rosterVer },
    minSample,
  );
  await store.putPublic(`stats/${prefix}/latest.json`, latest, "latest");
  await store.putPublic(`stats/${prefix}/${today}.json`, latest, "snapshot");

  return { prefix, added, skipped, total: state.runs.total };
}

/** 모든 게임 × 언어 × 난이도 집계 */
export async function aggregateAll(opts: {
  games: GameDef[];
  now: number;
  minSample: number;
  source: RunSource;
  store: StatsStore;
}): Promise<ComboResult[]> {
  const results: ComboResult[] = [];
  for (const game of opts.games)
    for (const lang of LANGS)
      for (const difficulty of DIFFICULTIES)
        results.push(await aggregateCombo({ ...opts, game, lang, difficulty }));
  return results;
}
