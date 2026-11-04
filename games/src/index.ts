import type { GameDef, GameIndexEntry } from "@rosterush/core";
import genshin from "../genshin.json";
import index from "../index.json";
import overwatch from "../overwatch.json";
import starrail from "../starrail.json";

/** 게임 추가 = JSON 파일 1개 + 등록부(index.json) 1줄 + 아래 맵 1줄 */
const DEFS: Record<string, GameDef> = {
  overwatch: overwatch as GameDef,
  genshin: genshin as GameDef,
  starrail: starrail as GameDef,
};

export const gameIndex: GameIndexEntry[] = index;

export const games: GameDef[] = gameIndex.filter((g) => g.enabled).map((g) => getGameOrThrow(g.id));

export function getGame(id: string): GameDef | undefined {
  return DEFS[id];
}

function getGameOrThrow(id: string): GameDef {
  const g = DEFS[id];
  if (!g) throw new Error(`game "${id}" is in index.json but has no definition`);
  return g;
}

export { validateGame } from "./validate";
