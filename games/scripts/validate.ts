import { gameIndex, getGame, validateGame } from "../src/index";

let failed = false;
for (const entry of gameIndex) {
  const game = getGame(entry.id);
  const errors = game ? validateGame(game) : [`[${entry.id}] 정의 파일 없음`];
  if (errors.length) {
    failed = true;
    for (const e of errors) console.error(`✗ ${e}`);
  } else {
    console.log(`✓ ${entry.id} (rosterVer ${game?.rosterVer}, ${game?.characters.length}명)`);
  }
}
process.exit(failed ? 1 : 0);
