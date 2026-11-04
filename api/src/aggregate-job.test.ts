import { type AggState, type LatestStats, newUlid, ulidDate } from "@rosterush/core";
import { getGame } from "@rosterush/games";
import { describe, expect, it } from "vitest";
import {
  aggregateCombo,
  dateRange,
  type RunSource,
  SAFETY_MS,
  type StatsStore,
  type StoredRun,
} from "./lib/aggregate-job";

const game = getGame("overwatch");
if (!game) throw new Error("overwatch missing");
const ids = game.characters.map((c) => c.id);
const HOUR = 60 * 60 * 1000;
const NOW = Date.parse("2026-11-05T12:00:00Z");

/** 메모리 결과 테이블 */
function memorySource() {
  const rows = new Map<string, StoredRun[]>();
  const add = (at: number, run: Omit<StoredRun, "sk" | "rosterVer">, lang = "ko") => {
    const sk = newUlid(at);
    const pk = `overwatch#${lang}#normal#${ulidDate(sk)}`;
    rows.set(pk, [...(rows.get(pk) ?? []), { ...run, rosterVer: 1, sk }]);
  };
  const source: RunSource = {
    async *query(pk, from, to) {
      const list = (rows.get(pk) ?? []).filter((r) => r.sk >= from && r.sk <= to);
      yield* list.sort((a, b) => (a.sk < b.sk ? -1 : 1));
    },
  };
  return { add, source };
}

/** 메모리 저장소 */
function memoryStore() {
  const states = new Map<string, AggState>();
  const files = new Map<string, LatestStats>();
  const store: StatsStore = {
    getState: async (p) => structuredClone(states.get(p) ?? null),
    putState: async (p, s) => void states.set(p, structuredClone(s)),
    putPublic: async (path, body) => void files.set(path, structuredClone(body)),
  };
  return { store, states, files };
}

const clear = (ms: number) => ({
  endReason: "clear" as const,
  totalMs: ms,
  solves: Object.fromEntries(ids.map((id, i) => [id, Math.round(((i + 1) / ids.length) * ms)])),
});

const run = (opts: { now: number; source: RunSource; store: StatsStore }) =>
  aggregateCombo({ game, lang: "ko", difficulty: "normal", minSample: 2, ...opts });

describe("dateRange", () => {
  it("양 끝을 포함한다", () => {
    expect(dateRange("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });
});

describe("aggregateCombo", () => {
  it("첫 집계: 최근 기록을 더하고, flagged와 5분 이내 기록은 제외한다", async () => {
    const { add, source } = memorySource();
    const { store, states, files } = memoryStore();
    add(NOW - 3 * 24 * HOUR, clear(200_000));
    add(NOW - 2 * HOUR, clear(300_000));
    add(NOW - 1 * HOUR, { ...clear(10_000), flagged: true });
    add(NOW - SAFETY_MS / 2, clear(250_000)); // 아직 안전 구간 안
    add(NOW - 1 * HOUR, clear(100_000), "ja"); // 다른 조합

    const r = await run({ now: NOW, source, store });
    expect(r).toMatchObject({ added: 2, skipped: 1, total: 2 });

    const latest = files.get("stats/overwatch/ko/normal/latest.json");
    expect(latest?.clearTime.n).toBe(2);
    expect(latest?.clearTime.p).toHaveLength(99);
    expect(files.has("stats/overwatch/ko/normal/2026-11-05.json")).toBe(true);
    expect(states.get("overwatch/ko/normal")?.cursor).toBeTruthy();
  });

  it("다음 집계: cursor 이후 기록만 더한다 (중복 없음)", async () => {
    const { add, source } = memorySource();
    const { store, files } = memoryStore();
    add(NOW - 2 * HOUR, clear(300_000));
    add(NOW - SAFETY_MS / 2, clear(250_000));
    await run({ now: NOW, source, store });

    add(NOW + 1 * HOUR, clear(150_000));
    const r = await run({ now: NOW + 3 * 24 * HOUR, source, store });

    expect(r).toMatchObject({ added: 2, total: 3 }); // 안전 구간에 있던 기록 + 새 기록
    expect(files.get("stats/overwatch/ko/normal/latest.json")?.runs.clear).toBe(3);
  });

  it("표본이 부족하면 백분위를 공개하지 않는다", async () => {
    const { add, source } = memorySource();
    const { store, files } = memoryStore();
    add(NOW - HOUR, clear(200_000));
    await run({ now: NOW, source, store });
    expect(files.get("stats/overwatch/ko/normal/latest.json")?.clearTime.p).toBeNull();
  });
});
