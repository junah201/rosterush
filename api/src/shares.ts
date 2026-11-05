import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { SHARE_ID_RE, ShareRequest, type ShareResponse } from "@rosterush/core";
import { ddb } from "./lib/dynamo";
import { HttpError, handler, json, parseBody } from "./lib/http";
import type { ShareItem } from "./lib/share-core";
import { toShareView } from "./lib/share-core";
import { ensureShare } from "./lib/share-create";
import { TABLES } from "./lib/tables";

const shareUrl = (shareId: string) => `${process.env.PUBLIC_ORIGIN ?? ""}/s/${shareId}`;

/**
 * POST /api/shares — 기록을 공유 링크로 만든다.
 * 클라이언트는 resultId만 보내고, 같은 기록을 다시 공유하면 같은 shareId (201 대신 200).
 */
export const create = handler(async (event) => {
  const req = parseBody(event, ShareRequest);
  const { shareId, created } = await ensureShare(req.resultId, req.nickname);
  return json(created ? 201 : 200, { shareId, url: shareUrl(shareId) } satisfies ShareResponse);
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
