/**
 * 로컬 DynamoDB에 가짜 기록을 넣는다 (집계·그래프 확인용).
 * 기록 시각은 최근 7일 안에서 무작위, 완주 시간은 로그정규 분포에 가깝게 생성한다.
 *
 * 사용: pnpm --filter @rosterush/api db:seed [game] [lang] [difficulty] [count]
 *       예) db:seed overwatch ko normal 300
 */
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import {
  type Difficulty,
  type EndReason,
  type Lang,
  newUlid,
  resultKeys,
  rosterAt,
  TIME_LIMIT_MS,
} from "@rosterush/core";

process.env.DYNAMODB_ENDPOINT ??= "http://localhost:8000";
process.env.STAGE ??= "local";

const { getGame } = await import("@rosterush/games");
const { ddb } = await import("../src/lib/dynamo");
const { TABLES } = await import("../src/lib/tables");

const [gameId = "overwatch", lang = "ko", difficulty = "normal", countArg = "200"] =
  process.argv.slice(2);
const game = getGame(gameId);
if (!game) throw new Error(`unknown game: ${gameId}`);
const ids = rosterAt(game).map((c) => c.id);

/** 대략 정규분포 */
const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.7;
const shuffle = <T>(a: T[]) =>
  a
    .map((v) => [Math.random(), v] as const)
    .sort((x, y) => x[0] - y[0])
    .map(([, v]) => v);

function fakeRun() {
  const median = ids.length * 6_000; // 캐릭터당 평균 6초
  const totalMs = Math.round(Math.min(TIME_LIMIT_MS, median * Math.exp(gauss() * 0.35)));
  const roll = Math.random();
  const endReason: EndReason =
    totalMs >= TIME_LIMIT_MS ? "timeout" : roll < 0.7 ? "clear" : "giveup";
  const solvedIds =
    endReason === "clear"
      ? shuffle(ids)
      : shuffle(ids).slice(0, Math.floor(ids.length * (0.3 + Math.random() * 0.6)));
  const times = solvedIds.map(() => Math.random() * totalMs).sort((a, b) => a - b);
  times[times.length - 1] = totalMs;
  const solves = Object.fromEntries(
    solvedIds.map((id, i) => [id, Math.max(1, Math.round(times[i] ?? totalMs))]),
  );
  return { endReason, totalMs, solves };
}

const count = Number(countArg);
const now = Date.now();
const items = Array.from({ length: count }, () => {
  const at = now - 10 * 60_000 - Math.random() * 7 * 24 * 60 * 60_000;
  const ulid = newUlid(at);
  const run = fakeRun();
  const createdAt = Math.floor(at / 1000);
  return {
    ...resultKeys({
      game: game.id,
      lang: lang as Lang,
      difficulty: difficulty as Difficulty,
      ulid,
    }),
    rosterVer: game.rosterVer,
    ...run,
    completed: run.endReason === "clear",
    ipHash: "seed",
    createdAt,
    expiresAt: createdAt + 30 * 24 * 60 * 60,
  };
});

for (let i = 0; i < items.length; i += 25) {
  await ddb.send(
    new BatchWriteCommand({
      RequestItems: {
        [TABLES.results]: items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } })),
      },
    }),
  );
}
console.log(`✓ seeded ${count} runs: ${game.id}/${lang}/${difficulty}`);
