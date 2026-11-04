/**
 * 로컬 집계: DynamoDB Local → api/.local/internal (state) + web/public/stats (공개 JSON).
 * next dev가 web/public을 서빙하므로 http://localhost:3000/stats/... 로 바로 확인할 수 있다.
 *
 * 사용: pnpm --filter @rosterush/api aggregate:local
 *       MIN_SAMPLE=1 pnpm --filter @rosterush/api aggregate:local   (표본 기준을 낮춰 확인)
 *       pnpm --filter @rosterush/api aggregate:local --reset         (로컬 state를 지우고 처음부터)
 *
 * 증분 집계라서 cursor보다 과거 시각의 기록(예: db:seed로 넣은 기록)은 다음 집계에 포함되지 않는다.
 * 시드 후에는 --reset으로 처음부터 다시 집계한다.
 */
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

process.env.DYNAMODB_ENDPOINT ??= "http://localhost:8000";
process.env.STAGE ??= "local";

const { games } = await import("@rosterush/games");
const { aggregateAll } = await import("../src/lib/aggregate-job");
const { ddb } = await import("../src/lib/dynamo");
const { dynamoRunSource, fsStatsStore } = await import("../src/lib/stats-io");
const { TABLES } = await import("../src/lib/tables");

const root = resolve(import.meta.dirname, "..");
const internalDir = resolve(root, ".local");
const publicDir = resolve(root, "../web/public");

if (process.argv.includes("--reset")) {
  await rm(resolve(internalDir, "internal"), { recursive: true, force: true });
  await rm(resolve(publicDir, "stats"), { recursive: true, force: true });
  console.log("reset local stats");
}

const results = await aggregateAll({
  games,
  now: Date.now(),
  minSample: Number(process.env.MIN_SAMPLE ?? 100),
  source: dynamoRunSource(ddb, TABLES.results),
  store: fsStatsStore(internalDir, publicDir),
});

for (const r of results.filter((r) => r.added || r.skipped || r.total))
  console.log(`${r.prefix}: +${r.added} (skipped ${r.skipped}), total ${r.total}`);
console.log(`✓ ${results.length} combos aggregated`);
