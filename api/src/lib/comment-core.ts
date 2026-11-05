import {
  type Comment,
  type CommentKey,
  type CommentRecord,
  type GameDef,
  type Lang,
  makeCommentId,
  type ResultKey,
  rosterAt,
} from "@rosterush/core";
import type { StoredResult } from "./share-core";

/** comments 테이블 아이템 */
export type CommentItem = {
  pk: string;
  sk: string;
  game: string;
  lang: Lang;
  nickname: string;
  pwHash: string;
  body: string;
  status: Comment["status"];
  replyCount: number;
  likeCount: number;
  ipHash: string;
  record?: CommentRecord;
  /** epoch seconds */
  createdAt: number;
  editedAt: number | null;
};

/** 아이템 → 댓글 키 (답글은 pk = R#부모ULID) */
export function keyOfItem(item: Pick<CommentItem, "pk" | "sk" | "game" | "lang">): CommentKey {
  return {
    game: item.game,
    lang: item.lang,
    parent: item.pk.startsWith("R#") ? item.pk.slice(2) : null,
    ulid: item.sk,
  };
}

const iso = (sec: number) => new Date(sec * 1000).toISOString();

/** 저장 아이템 → 공개 응답. pwHash·ipHash는 내보내지 않고, 삭제된 댓글은 내용을 비운다 */
export function toComment(item: CommentItem): Comment {
  const active = item.status === "active";
  return {
    id: makeCommentId(keyOfItem(item)),
    nickname: active ? item.nickname : "",
    body: active ? item.body : "",
    status: item.status,
    replyCount: item.replyCount,
    likeCount: item.likeCount,
    createdAt: iso(item.createdAt),
    editedAt: item.editedAt === null ? null : iso(item.editedAt),
    record: active ? (item.record ?? null) : null,
  };
}

/** 첨부할 기록 요약 (서버가 results에서 읽은 값으로 만든다) */
export function toCommentRecord(
  shareId: string,
  key: ResultKey,
  game: GameDef,
  result: StoredResult,
): CommentRecord {
  return {
    shareId,
    lang: key.lang,
    difficulty: key.difficulty,
    rosterVer: result.rosterVer,
    endReason: result.endReason,
    totalMs: result.totalMs,
    solved: Object.keys(result.solves).length,
    total: rosterAt(game, result.rosterVer).length,
  };
}
