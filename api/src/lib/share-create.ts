import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import { GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { type GameDef, parseResultId, type ResultKey, resultKeys } from "@rosterush/core";
import { getGame } from "@rosterush/games";
import { ddb } from "./dynamo";
import { HttpError } from "./http";
import { buildShareItem, type ShareItem, type StoredResult } from "./share-core";
import { newShareId } from "./share-id";
import { getLatestStats } from "./stats-read";
import { TABLES } from "./tables";

const MAX_ID_ATTEMPTS = 3;

export type EnsuredShare = {
  shareId: string;
  /** 이번 호출에서 새로 만들었는지 (아니면 이미 공유된 기록) */
  created: boolean;
  key: ResultKey;
  game: GameDef;
  result: StoredResult;
};

async function getResult(key: ResultKey): Promise<StoredResult | null> {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.results, Key: resultKeys(key) }),
  );
  return (Item as StoredResult | undefined) ?? null;
}

const notFound = () => new HttpError("RESULT_NOT_FOUND", "result not found");

/**
 * resultId의 공유 링크를 만들거나, 이미 있으면 그대로 돌려준다 (공유 API와 댓글 기록 첨부가 같이 쓴다).
 * - 기록 값은 서버가 results에서 직접 읽어 복사한다 (위조 불가)
 * - shares 저장과 results.shareId 표시를 한 트랜잭션으로 처리해 동시에 불러도 하나만 생긴다
 * - 의심 기록(flagged)·만료된 기록은 RESULT_NOT_FOUND
 */
export async function ensureShare(resultId: string, nickname?: string): Promise<EnsuredShare> {
  const key = parseResultId(resultId);
  const game = key && getGame(key.game);
  if (!key || !game) throw notFound();

  const result = await getResult(key);
  // 의심 기록(flagged)은 존재를 드러내지 않는다
  if (!result || result.flagged) throw notFound();
  if (result.shareId) return { shareId: result.shareId, created: false, key, game, result };

  const stats = await getLatestStats(key.game, key.lang, key.difficulty);

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const item: ShareItem = buildShareItem({
      shareId: newShareId(),
      resultId,
      key,
      game,
      result,
      stats,
      nickname,
      now: Date.now(),
    });
    try {
      await ddb.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: TABLES.shares,
                Item: item,
                ConditionExpression: "attribute_not_exists(shareId)",
              },
            },
            {
              Update: {
                TableName: TABLES.results,
                Key: resultKeys(key),
                UpdateExpression: "SET shareId = :id",
                ConditionExpression: "attribute_exists(pk) AND attribute_not_exists(shareId)",
                ExpressionAttributeValues: { ":id": item.shareId },
              },
            },
          ],
        }),
      );
      return { shareId: item.shareId, created: true, key, game, result };
    } catch (e) {
      if (!(e instanceof TransactionCanceledException)) throw e;
      const [shareReason, resultReason] = e.CancellationReasons ?? [];
      if (resultReason?.Code === "ConditionalCheckFailed") {
        // 동시에 다른 요청이 먼저 공유함 → 그 shareId를 돌려준다
        const latest = await getResult(key);
        if (latest?.shareId)
          return { shareId: latest.shareId, created: false, key, game, result: latest };
        throw notFound(); // 그 사이 만료됨
      }
      if (shareReason?.Code === "ConditionalCheckFailed") continue; // shareId 충돌 → 새 id로 재시도
      throw e;
    }
  }
  throw new Error("could not allocate a unique shareId");
}
