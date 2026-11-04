import type { ResultRequest } from "@rosterush/core";
import { getGame } from "@rosterush/games";
import { describe, expect, it } from "vitest";
import { checkRun } from "./lib/check-run";

const game = getGame("overwatch");
if (!game) throw new Error("overwatch missing");
const ids = game.characters.map((c) => c.id);

const req = (over: Partial<ResultRequest> = {}): ResultRequest => ({
  game: "overwatch",
  lang: "ko",
  difficulty: "normal",
  rosterVer: game.rosterVer,
  endReason: "clear",
  totalMs: 60_000,
  solves: Object.fromEntries(ids.map((id, i) => [id, (i + 1) * 5_000])),
  ...over,
});

describe("checkRun", () => {
  it("정상 기록은 통과", () => {
    expect(checkRun(game, req())).toEqual({ flagged: false });
  });
  it("모르는 rosterVer는 거부", () => {
    expect(() => checkRun(game, req({ rosterVer: 99 }))).toThrow(/rosterVer/);
  });
  it("로스터에 없는 캐릭터는 거부", () => {
    expect(() => checkRun(game, req({ endReason: "giveup", solves: { nobody: 1000 } }))).toThrow(
      /unknown character/,
    );
  });
  it("clear인데 전원을 맞히지 않았으면 거부", () => {
    expect(() => checkRun(game, req({ solves: { tracer: 1000 } }))).toThrow(/all characters/);
  });
  it("비현실적으로 빠른 기록은 거부하지 않고 flagged", () => {
    const solves = Object.fromEntries(ids.map((id, i) => [id, i + 1]));
    expect(checkRun(game, req({ totalMs: 100, solves }))).toEqual({ flagged: true });
  });
});
