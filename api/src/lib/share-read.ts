import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { SHARE_ID_RE } from "@rosterush/core";
import { ddb } from "./dynamo";
import type { ShareItem } from "./share-core";
import { TABLES } from "./tables";

/** shares 테이블에서 공유 기록을 읽는다. 형식이 틀린 id는 조회하지 않고 null */
export async function getShareItem(shareId: string): Promise<ShareItem | null> {
  if (!SHARE_ID_RE.test(shareId)) return null;
  const { Item } = await ddb.send(new GetCommand({ TableName: TABLES.shares, Key: { shareId } }));
  return (Item as ShareItem | undefined) ?? null;
}
