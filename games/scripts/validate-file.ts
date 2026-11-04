/**
 * 등록 전 게임 정의 파일 하나를 검증한다.
 * 사용: pnpm --filter @rosterush/games exec tsx scripts/validate-file.ts genshin.json
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GameDef } from "@rosterush/core";
import { validateGame } from "../src/validate";

const file = process.argv[2];
if (!file) {
  console.error("usage: tsx scripts/validate-file.ts <game>.json");
  process.exit(2);
}

const game = JSON.parse(readFileSync(resolve(file), "utf8")) as GameDef;
const errors = validateGame(game);
for (const e of errors) console.error(`✗ ${e}`);
console.log(
  errors.length ? `${errors.length} error(s)` : `✓ ${game.id} (${game.characters.length}명)`,
);
process.exit(errors.length ? 1 : 0);
