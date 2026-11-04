import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import { GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import {
  parseResultId,
  type ResultKey,
  resultKeys,
  SHARE_ID_RE,
  ShareRequest,
  type ShareResponse,
} from "@rosterush/core";
import { getGame } from "@rosterush/games";
import { ddb } from "./lib/dynamo";
import { HttpError, handler, json, parseBody } from "./lib/http";
import { buildShareItem, type ShareItem, type StoredResult, toShareView } from "./lib/share-core";
import { newShareId } from "./lib/share-id";
import { getLatestStats } from "./lib/stats-read";
import { TABLES } from "./lib/tables";

const MAX_ID_ATTEMPTS = 3;
const shareUrl = (shareId: string) => `${process.env.PUBLIC_ORIGIN ?? ""}/s/${shareId}`;

async function getResult(key: ResultKey): Promise<StoredResult | null> {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.results, Key: resultKeys(key) }),
  );
  return (Item as StoredResult | undefined) ?? null;
}

/**
 * POST /api/shares — 기록을 공유 링크로 만든다.
 * - 클라이언트는 기록 값을 보내지 않고 resultId만 보낸다 (서버가 원본을 읽어 복사 → 위조 불가)
 * - 같은 기록을 다시 공유하면 같은 shareId (results.shareId로 표시)
 * - shares 저장과 results 표시를 한 트랜잭션으로 처리해 동시에 눌러도 하나만 생긴다
 */
export const create = handler(async (event) => {
  const req = parseBody(event, ShareRequest);
  const key = parseResultId(req.resultId);
  const game = key && getGame(key.game);
  if (!key || !game) throw new HttpError("RESULT_NOT_FOUND", "result not found");

  const result = await getResult(key);
  // 의심 기록(flagged)은 존재를 드러내지 않는다
  if (!result || result.flagged) throw new HttpError("RESULT_NOT_FOUND", "result not found");
  if (result.shareId) {
    return json(200, {
      shareId: result.shareId,
      url: shareUrl(result.shareId),
    } satisfies ShareResponse);
  }

  const stats = await getLatestStats(key.game, key.lang, key.difficulty);

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const item: ShareItem = buildShareItem({
      shareId: newShareId(),
      resultId: req.resultId,
      key,
      game,
      result,
      stats,
      nickname: req.nickname,
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
      return json(201, {
        shareId: item.shareId,
        url: shareUrl(item.shareId),
      } satisfies ShareResponse);
    } catch (e) {
      if (!(e instanceof TransactionCanceledException)) throw e;
      const [shareReason, resultReason] = e.CancellationReasons ?? [];
      if (resultReason?.Code === "ConditionalCheckFailed") {
        // 동시에 다른 요청이 먼저 공유함 → 그 shareId를 돌려준다
        const latest = await getResult(key);
        if (latest?.shareId)
          return json(200, {
            shareId: latest.shareId,
            url: shareUrl(latest.shareId),
          } satisfies ShareResponse);
        throw new HttpError("RESULT_NOT_FOUND", "result not found"); // 그 사이 만료됨
      }
      if (shareReason?.Code === "ConditionalCheckFailed") continue; // shareId 충돌 → 새 id로 재시도
      throw e;
    }
  }
  throw new Error("could not allocate a unique shareId");
});

/** GET /api/shares/{shareId} — 공유 상세 (내용이 바뀌지 않으므로 오래 캐시) */
export const get = handler(async (event) => {
  const shareId = event.pathParameters?.shareId ?? "";
  if (!SHARE_ID_RE.test(shareId)) throw new HttpError("SHARE_NOT_FOUND", "share not found");

  const { Item } = await ddb.send(new GetCommand({ TableName: TABLES.shares, Key: { shareId } }));
  if (!Item) throw new HttpError("SHARE_NOT_FOUND", "share not found");

  return json(200, toShareView(Item as ShareItem), {
    "cache-control": "public, max-age=31536000, immutable",
  });
});
