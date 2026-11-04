import { PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  makeResultId,
  newUlid,
  ResultRequest,
  type ResultResponse,
  resultKeys,
} from "@rosterush/core";
import { getGame } from "@rosterush/games";
import { checkRun } from "./lib/check-run";
import { ddb } from "./lib/dynamo";
import { HttpError, handler, ipHash, json, parseBody } from "./lib/http";
import { TABLES } from "./lib/tables";

const TTL_SECONDS = 30 * 24 * 60 * 60;

/** POST /api/results — 게임 종료 기록 저장 */
export const main = handler(async (event) => {
  const req = parseBody(event, ResultRequest);
  const game = getGame(req.game);
  if (!game) throw new HttpError("UNKNOWN_GAME", "unknown game");

  const { flagged } = checkRun(game, req);
  // TODO: ipHash 기준 IP별 요청 제한 (ratelimits 테이블)

  const now = Date.now();
  const key = { game: req.game, lang: req.lang, difficulty: req.difficulty, ulid: newUlid(now) };
  const createdAt = Math.floor(now / 1000);

  await ddb.send(
    new PutCommand({
      TableName: TABLES.results,
      Item: {
        ...resultKeys(key),
        rosterVer: req.rosterVer,
        endReason: req.endReason,
        completed: req.endReason === "clear",
        totalMs: req.totalMs,
        solves: req.solves,
        flagged: flagged || undefined,
        ipHash: ipHash(event),
        createdAt,
        expiresAt: createdAt + TTL_SECONDS,
      },
    }),
  );

  return json(201, { resultId: makeResultId(key) } satisfies ResultResponse);
});
