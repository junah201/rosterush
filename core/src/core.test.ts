import { describe, expect, it } from "vitest";
import { addRun, emptyState, toLatest } from "./aggregate";
import { makeCommentId, makeResultId, parseCommentId, parseResultId, resultKeys } from "./ids";
import { normalize } from "./normalize";
import { HIST_BINS, histToClearTime, topPercent } from "./percentile";
import { buildLookup, groupCharacters, judge, rosterAt } from "./roster";
import type { GameDef } from "./types";

const names = (ko: string, ja: string, en: string, short: string[] = []) => ({
  ko: { full: [ko], short },
  ja: { full: [ja], short: [] },
  en: { full: [en], short: [] },
});

const game: GameDef = {
  id: "test",
  rosterVer: 2,
  name: { ko: "테스트", ja: "テスト", en: "Test" },
  groupings: [
    {
      id: "role",
      name: { ko: "역할", ja: "ロール", en: "Role" },
      groups: [
        { id: "tank", name: { ko: "돌격", ja: "タンク", en: "Tank" } },
        { id: "damage", name: { ko: "공격", ja: "ダメージ", en: "Damage" } },
      ],
    },
  ],
  characters: [
    {
      id: "tracer",
      addedIn: 1,
      groups: { role: "damage" },
      names: names("트레이서", "トレーサー", "Tracer", ["트레"]),
    },
    {
      id: "rein",
      addedIn: 1,
      groups: { role: "tank" },
      names: names("라인하르트", "ラインハルト", "Reinhardt"),
    },
    {
      id: "soldier",
      addedIn: 1,
      groups: { role: "damage" },
      priority: { role: 10 },
      names: names("솔저: 76", "ソルジャー76", "Soldier: 76"),
    },
    {
      id: "hazard",
      addedIn: 2,
      groups: { role: "tank" },
      names: names("해저드", "ハザード", "Hazard"),
    },
  ],
};

describe("normalize", () => {
  it("공백·구두점·대소문자를 무시한다", () => {
    expect(normalize(" Soldier: 76 ")).toBe("soldier76");
    expect(normalize("솔저 76")).toBe(normalize("솔저: 76"));
  });
  it("가타카나와 히라가나를 같게 본다", () => {
    expect(normalize("トレーサー")).toBe(normalize("とれーさー"));
  });
  it("전각 문자를 반각으로 바꾼다", () => {
    expect(normalize("ＴＲＡＣＥＲ")).toBe("tracer");
  });
});

describe("roster / judge", () => {
  it("addedIn 기준으로 과거 로스터를 계산한다", () => {
    expect(rosterAt(game, 1).map((c) => c.id)).toEqual(["tracer", "rein", "soldier"]);
    expect(rosterAt(game).length).toBe(4);
  });
  it("어려움은 full만, 보통은 short도 인정한다", () => {
    expect(judge(buildLookup(game, "ko", "normal"), "트레")).toBe("tracer");
    expect(judge(buildLookup(game, "ko", "hard"), "트레")).toBeNull();
    expect(judge(buildLookup(game, "ja", "hard"), "とれーさー")).toBe("tracer");
  });
  it("그룹 순서 → priority → 배열 순서로 정렬한다", () => {
    const g = groupCharacters(game);
    expect(g.map((x) => x.group?.id)).toEqual(["tank", "damage"]);
    expect(g[1]?.characters.map((c) => c.id)).toEqual(["soldier", "tracer"]);
  });
});

describe("ids", () => {
  const u = "01JC8Z3K9QX7M2B4N6P8R0T2V4";
  it("resultId를 만들고 해석한다", () => {
    const id = makeResultId({ game: "genshin", lang: "ko", difficulty: "normal", ulid: u });
    expect(id).toBe(`genshin.ko.normal.${u}`);
    const k = parseResultId(id);
    expect(k).toEqual({ game: "genshin", lang: "ko", difficulty: "normal", ulid: u });
    expect(k && resultKeys(k).pk).toMatch(/^genshin#ko#normal#\d{4}-\d{2}-\d{2}$/);
    expect(parseResultId("genshin.xx.normal.abc")).toBeNull();
  });
  it("commentId로 원댓글/답글을 구분한다", () => {
    expect(
      parseCommentId(makeCommentId({ game: "genshin", lang: "ko", parent: null, ulid: u }))?.parent,
    ).toBeNull();
    expect(parseCommentId(`genshin.ko.${u}.${u}`)?.parent).toBe(u);
  });
});

describe("percentile", () => {
  const bins = Array<number>(HIST_BINS).fill(0);
  for (let s = 100; s < 300; s++) bins[s] = 1; // 100~300초에 균등 분포, 200건
  const ct = histToClearTime(bins, 100);

  it("표본이 부족하면 null", () => {
    expect(histToClearTime(bins, 1000).p).toBeNull();
  });
  it("균등 분포에서 p50은 중간값", () => {
    expect(ct.p).toHaveLength(99);
    expect(ct.p?.[49]).toBe(200_000);
  });
  it("topPercent는 빠를수록 작다", () => {
    expect(topPercent(150_000, ct)).toBeCloseTo(25, 0);
    expect(topPercent(1_000, ct)).toBe(0.1);
    expect(topPercent(599_000, ct)).toBe(99.9);
  });
});

describe("aggregate", () => {
  it("기록을 증분으로 더하고 latest를 계산한다", () => {
    const s = emptyState("2026-10-01");
    const roster = ["tracer", "rein", "soldier"];
    addRun(
      s,
      {
        rosterVer: 1,
        endReason: "clear",
        totalMs: 150_000,
        solves: { soldier: 20_000, tracer: 40_000, rein: 150_000 },
      },
      roster,
    );
    addRun(
      s,
      {
        rosterVer: 1,
        endReason: "giveup",
        totalMs: 300_000,
        solves: { tracer: 10_000, soldier: 25_000 },
      },
      roster,
    );

    expect(s.runs).toEqual({ total: 2, clear: 1, giveup: 1, timeout: 0 });
    expect(s.clearHist["1"]?.bins[150]).toBe(1);
    expect(s.characters.tracer).toEqual({ n: 2, found: 2, first: 1, rankSum: 0.5, msSum: 50_000 });
    expect(s.characters.rein).toEqual({ n: 2, found: 1, first: 0, rankSum: 1, msSum: 150_000 });

    const latest = toLatest(
      s,
      { game: "test", lang: "ko", difficulty: "normal", aggVersion: "2026-11-05", rosterVer: 1 },
      1,
    );
    expect(latest.characters?.rein?.found).toBe(0.5);
    expect(latest.clearTime.n).toBe(1);
  });
});
