import { describe, expect, it } from "vitest";
import { gameIndex, getGame, validateGame } from "./index";

describe("게임 데이터", () => {
  for (const entry of gameIndex) {
    it(`${entry.id}: 검증 통과`, () => {
      const game = getGame(entry.id);
      expect(game, "index.json에 있지만 정의가 없음").toBeDefined();
      if (game) expect(validateGame(game)).toEqual([]);
    });
  }

  it("검증기가 별칭 충돌을 잡는다", () => {
    const game = structuredClone(getGame("overwatch"));
    if (!game) throw new Error("no overwatch");
    const ana = game.characters.find((c) => c.id === "ana");
    ana?.names.ko.short.push("트레");
    expect(validateGame(game).some((e) => e.includes("별칭 충돌"))).toBe(true);
  });
});
