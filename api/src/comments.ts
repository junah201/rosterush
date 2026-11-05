import {
  ConditionalCheckFailedException,
  TransactionCanceledException,
} from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  COMMENT_PAGE_SIZE,
  type Comment,
  CommentCreateRequest,
  CommentDeleteRequest,
  type CommentDeleteResponse,
  type CommentKey,
  CommentUpdateRequest,
  commentKeys,
  isUlid,
  LANGS,
  type Lang,
  makeCommentId,
  newUlid,
  type Page,
  parseCommentId,
  parseResultId,
  REPLY_PAGE_SIZE,
} from "@rosterush/core";
import { getGame } from "@rosterush/games";
import { type CommentItem, toComment, toCommentRecord } from "./lib/comment-core";
import { ddb } from "./lib/dynamo";
import { type Event, HttpError, handler, ipHash, json, parseBody } from "./lib/http";
import { hashPassword, verifyPassword } from "./lib/password";
import { assertUnder, count, hit, LIMITS } from "./lib/ratelimit";
import { ensureShare } from "./lib/share-create";
import { TABLES } from "./lib/tables";

const T = TABLES.comments;
const notFound = () => new HttpError("COMMENT_NOT_FOUND", "comment not found");

// ─── 공통 ────────────────────────────────────────────────────────────────

/** 경로의 {game}/{lang} 검증 */
function gameLang(event: Event): { game: string; lang: Lang } {
  const game = event.pathParameters?.game ?? "";
  const lang = event.pathParameters?.lang ?? "";
  if (!getGame(game)) throw new HttpError("UNKNOWN_GAME", "unknown game");
  if (!LANGS.includes(lang as Lang)) throw new HttpError("INVALID_INPUT", "unknown lang");
  return { game, lang: lang as Lang };
}

function commentKey(event: Event): CommentKey {
  const key = parseCommentId(event.pathParameters?.commentId ?? "");
  if (!key || !getGame(key.game)) throw notFound();
  return key;
}

function cursorOf(event: Event): string | undefined {
  const c = event.queryStringParameters?.cursor;
  if (c === undefined || c === "") return undefined;
  if (!isUlid(c)) throw new HttpError("INVALID_INPUT", "invalid cursor");
  return c;
}

async function getItem(key: CommentKey): Promise<CommentItem | null> {
  const { Item } = await ddb.send(new GetCommand({ TableName: T, Key: commentKeys(key) }));
  return (Item as CommentItem | undefined) ?? null;
}

async function page(
  pk: string,
  cursor: string | undefined,
  limit: number,
  newestFirst: boolean,
): Promise<Page<Comment>> {
  const { Items, LastEvaluatedKey } = await ddb.send(
    new QueryCommand({
      TableName: T,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": pk },
      ScanIndexForward: !newestFirst,
      Limit: limit,
      ...(cursor ? { ExclusiveStartKey: { pk, sk: cursor } } : {}),
    }),
  );
  return {
    items: ((Items ?? []) as CommentItem[]).map(toComment),
    nextCursor: (LastEvaluatedKey?.sk as string | undefined) ?? null,
  };
}

/** 같은 게임의 기록만 첨부. 공유 링크를 만들거나 재사용해 그 shareId를 남긴다 */
async function attachRecord(resultId: string, game: string, nickname: string) {
  if (parseResultId(resultId)?.game !== game)
    throw new HttpError("INVALID_INPUT", "record must be from the same game");
  const s = await ensureShare(resultId, nickname);
  return toCommentRecord(s.shareId, s.key, s.game, s.result);
}

async function newItem(
  key: CommentKey,
  req: CommentCreateRequest,
  ip: string,
): Promise<CommentItem> {
  const record = req.resultId
    ? await attachRecord(req.resultId, key.game, req.nickname)
    : undefined;
  return {
    ...commentKeys(key),
    game: key.game,
    lang: key.lang,
    nickname: req.nickname,
    pwHash: await hashPassword(req.password),
    body: req.body,
    status: "active",
    replyCount: 0,
    likeCount: 0,
    ipHash: ip,
    ...(record ? { record } : {}),
    createdAt: Math.floor(Date.now() / 1000),
    editedAt: null,
  };
}

/** 비밀번호 확인. 같은 IP가 한 댓글에 10분 동안 5번 틀리면 429 */
async function authorize(event: Event, key: CommentKey, item: CommentItem, password: string) {
  const ip = ipHash(event);
  const name = `pw#${makeCommentId(key)}`;
  await assertUnder(name, ip, LIMITS.passwordFail);
  if (!(await verifyPassword(password, item.pwHash))) {
    await count(name, ip, LIMITS.passwordFail);
    throw new HttpError("WRONG_PASSWORD", "wrong password");
  }
}

// ─── 원댓글 ──────────────────────────────────────────────────────────────

/** GET /api/games/{game}/{lang}/comments?cursor= — 원댓글 최신순 20개 */
export const list = handler(async (event) => {
  const { game, lang } = gameLang(event);
  const key = { game, lang, parent: null, ulid: "" };
  return json(200, await page(commentKeys(key).pk, cursorOf(event), COMMENT_PAGE_SIZE, true));
});

/** POST /api/games/{game}/{lang}/comments — 원댓글 작성 */
export const create = handler(async (event) => {
  const req = parseBody(event, CommentCreateRequest);
  const { game, lang } = gameLang(event);
  const ip = ipHash(event);
  await hit("comment", ip, LIMITS.commentWrite);

  const key = { game, lang, parent: null, ulid: newUlid() };
  const item = await newItem(key, req, ip);
  await ddb.send(
    new PutCommand({ TableName: T, Item: item, ConditionExpression: "attribute_not_exists(pk)" }),
  );
  return json(201, toComment(item));
});

// ─── 답글 ────────────────────────────────────────────────────────────────

/** GET /api/comments/{commentId}/replies?cursor= — 답글 오래된 순 */
export const listReplies = handler(async (event) => {
  const parent = commentKey(event);
  if (parent.parent) throw new HttpError("REPLY_DEPTH_EXCEEDED", "replies have no replies");
  return json(200, await page(`R#${parent.ulid}`, cursorOf(event), REPLY_PAGE_SIZE, false));
});

/** POST /api/comments/{commentId}/replies — 답글 작성 (부모 replyCount +1과 한 트랜잭션) */
export const reply = handler(async (event) => {
  const req = parseBody(event, CommentCreateRequest);
  const parent = commentKey(event);
  if (parent.parent) throw new HttpError("REPLY_DEPTH_EXCEEDED", "reply depth exceeded");
  const ip = ipHash(event);
  await hit("comment", ip, LIMITS.commentWrite);

  const key = { game: parent.game, lang: parent.lang, parent: parent.ulid, ulid: newUlid() };
  const item = await newItem(key, req, ip);
  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName: T, Item: item, ConditionExpression: "attribute_not_exists(pk)" } },
          {
            Update: {
              TableName: T,
              Key: commentKeys(parent),
              UpdateExpression: "SET replyCount = replyCount + :one",
              // 삭제된 원댓글에는 답글을 달 수 없다
              ConditionExpression: "attribute_exists(pk) AND #s = :active",
              ExpressionAttributeNames: { "#s": "status" },
              ExpressionAttributeValues: { ":one": 1, ":active": "active" },
            },
          },
        ],
      }),
    );
  } catch (e) {
    if (e instanceof TransactionCanceledException) throw notFound();
    throw e;
  }
  return json(201, toComment(item));
});

// ─── 수정 / 삭제 ─────────────────────────────────────────────────────────

/** PATCH /api/comments/{commentId} { password, body } */
export const update = handler(async (event) => {
  const req = parseBody(event, CommentUpdateRequest);
  const key = commentKey(event);
  const item = await getItem(key);
  if (item?.status !== "active") throw notFound();
  await authorize(event, key, item, req.password);

  try {
    const { Attributes } = await ddb.send(
      new UpdateCommand({
        TableName: T,
        Key: commentKeys(key),
        UpdateExpression: "SET body = :body, editedAt = :now",
        ConditionExpression: "#s = :active",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":body": req.body,
          ":now": Math.floor(Date.now() / 1000),
          ":active": "active",
        },
        ReturnValues: "ALL_NEW",
      }),
    );
    return json(200, toComment(Attributes as CommentItem));
  } catch (e) {
    if (e instanceof ConditionalCheckFailedException) throw notFound();
    throw e;
  }
});

/** 답글이 남은 원댓글: 자리만 남기고 내용을 지운다 ("삭제된 댓글입니다") */
async function softDelete(key: CommentKey) {
  await ddb.send(
    new UpdateCommand({
      TableName: T,
      Key: commentKeys(key),
      UpdateExpression: "SET #s = :deleted, body = :empty, nickname = :empty REMOVE #r",
      // status, record는 DynamoDB 예약어라 이름 치환이 필요하다
      ExpressionAttributeNames: { "#s": "status", "#r": "record" },
      ExpressionAttributeValues: { ":deleted": "deleted", ":empty": "" },
    }),
  );
}

/**
 * DELETE /api/comments/{commentId} { password }
 * - 원댓글: 답글이 있으면 soft 삭제, 없으면 hard 삭제
 * - 답글: hard 삭제 + 부모 replyCount -1. 부모가 soft 삭제 상태이고 답글이 0개가 되면 부모도 지운다
 */
export const remove = handler(async (event) => {
  const req = parseBody(event, CommentDeleteRequest);
  const key = commentKey(event);
  const item = await getItem(key);
  if (item?.status !== "active") throw notFound();
  await authorize(event, key, item, req.password);

  const id = makeCommentId(key);
  const done = (removed: CommentDeleteResponse["removed"]) =>
    json(200, { id, removed } satisfies CommentDeleteResponse);

  if (!key.parent) {
    if (item.replyCount > 0) {
      await softDelete(key);
      return done("soft");
    }
    try {
      await ddb.send(
        new DeleteCommand({
          TableName: T,
          Key: commentKeys(key),
          ConditionExpression: "replyCount = :zero",
          ExpressionAttributeValues: { ":zero": 0 },
        }),
      );
      return done("hard");
    } catch (e) {
      // 그 사이 답글이 달림
      if (!(e instanceof ConditionalCheckFailedException)) throw e;
      await softDelete(key);
      return done("soft");
    }
  }

  const parentKey = { ...key, parent: null, ulid: key.parent };
  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        { Delete: { TableName: T, Key: commentKeys(key) } },
        {
          Update: {
            TableName: T,
            Key: commentKeys(parentKey),
            UpdateExpression: "SET replyCount = replyCount - :one",
            ConditionExpression: "attribute_exists(pk)",
            ExpressionAttributeValues: { ":one": 1 },
          },
        },
      ],
    }),
  );
  try {
    await ddb.send(
      new DeleteCommand({
        TableName: T,
        Key: commentKeys(parentKey),
        ConditionExpression: "#s = :deleted AND replyCount = :zero",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":deleted": "deleted", ":zero": 0 },
      }),
    );
  } catch (e) {
    if (!(e instanceof ConditionalCheckFailedException)) throw e;
  }
  return done("hard");
});
