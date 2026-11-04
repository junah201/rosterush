import { type LatestStats, SHARE_ID_RE } from "@rosterush/core";
import { getGame } from "@rosterush/games";
import { describe, expect, it } from "vitest";
import {
  buildShareItem,
  type StoredResult,
  snapshotPercentile,
  toShareView,
} from "./lib/share-core";
import { newShareId } from "./lib/share-id";

const game = getGame("overwatch");
if (!game) throw new Error("overwatch missing");

const stats: LatestStats = {
  schema: 1,
  game: "overwatch",
  lang: "ko",
  difficulty: "normal",
  aggVersion: "2026-11-05",
  since: "2026-10-05",
  rosterVer: 1,
  minSample: 100,
  runs: { total: 300, clear: 200, giveup: 90, timeout: 10 },
  clearTime: {
    n: 200,
    min: 100_000,
    max: 600_000,
    p: Array.from({ length: 99 }, (_, i) => 100_000 + (i + 1) * 5_000),
  },
  characters: null,
};

const clear: StoredResult = {
  rosterVer: 1,
  endReason: "clear",
  totalMs: 150_000,
  solves: { tracer: 1000, mercy: 2000 },
};

describe("snapshotPercentile", () => {
  it("완주 + 같은 rosterVer면 백분위와 집계 버전을 남긴다", () => {
    expect(snapshotPercentile(clear, stats)).toEqual({ percentile: 10, aggVersion: "2026-11-05" });
  });
  it("완주가 아니면 null", () => {
    expect(snapshotPercentile({ ...clear, endReason: "giveup" }, stats).percentile).toBeNull();
  });
  it("로스터 버전이 다르면 null", () => {
    expect(snapshotPercentile(clear, { ...stats, rosterVer: 2 }).percentile).toBeNull();
  });
  it("집계가 없거나 표본이 부족하면 null", () => {
    expect(snapshotPercentile(clear, null)).toEqual({ percentile: null, aggVersion: null });
    const few = { ...stats, clearTime: { n: 3, min: null, max: null, p: null } };
    expect(snapshotPercentile(clear, few)).toEqual({ percentile: null, aggVersion: null });
  });
});

describe("share item / view", () => {
  const item = buildShareItem({
    shareId: "k3Fq9xZa",
    resultId: "overwatch.ko.normal.01JC8Z3K9QX7M2B4N6P8R0T2V4",
    key: {
      game: "overwatch",
      lang: "ko",
      difficulty: "normal",
      ulid: "01JC8Z3K9QX7M2B4N6P8R0T2V4",
    },
    game,
    result: clear,
    stats,
    nickname: "준아",
    now: Date.parse("2026-11-05T03:00:00Z"),
  });

  it("맞힌 수와 로스터 인원을 계산한다", () => {
    expect(item.solved).toBe(2);
    expect(item.total).toBe(game.characters.filter((c) => c.addedIn <= 1).length);
  });

  it("공개 응답에는 resultId가 없다 (본인 확인용 비밀값)", () => {
    const view = toShareView(item);
    expect(view).not.toHaveProperty("resultId");
    expect(JSON.stringify(view)).not.toContain("01JC8Z3K9QX7M2B4N6P8R0T2V4");
    expect(view.createdAt).toBe("2026-11-05T03:00:00.000Z");
    expect(view.nickname).toBe("준아");
  });

  it("닉네임이 없으면 null", () => {
    const { nickname: _n, ...noNick } = item;
    expect(toShareView(noNick).nickname).toBeNull();
  });
});

describe("newShareId", () => {
  it("8자 base62", () => {
    for (let i = 0; i < 100; i++) expect(newShareId()).toMatch(SHARE_ID_RE);
  });
});
