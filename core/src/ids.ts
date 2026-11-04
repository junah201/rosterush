import { decodeTime, encodeTime, ulid } from "ulid";
import { DIFFICULTIES, type Difficulty, LANGS, type Lang } from "./types";

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export const newUlid = (time?: number) => ulid(time === undefined ? undefined : Math.floor(time));

/** 해당 시각(ms)에 만들어질 수 있는 가장 큰 ULID — 시각 기준 범위 조회의 상한으로 사용 */
export function maxUlidAt(ms: number): string {
  return encodeTime(Math.floor(ms), 10) + "Z".repeat(16);
}

/** ULID 시각 → UTC 날짜 (YYYY-MM-DD) */
export function ulidDate(id: string): string {
  return new Date(decodeTime(id)).toISOString().slice(0, 10);
}

// ─── resultId: {game}.{lang}.{difficulty}.{ULID} ─────────────────────────

export type ResultKey = { game: string; lang: Lang; difficulty: Difficulty; ulid: string };

export function makeResultId(k: ResultKey): string {
  return `${k.game}.${k.lang}.${k.difficulty}.${k.ulid}`;
}

export function parseResultId(id: string): ResultKey | null {
  const [game, lang, difficulty, u, ...rest] = id.split(".");
  if (rest.length || !game || !u || !ULID_RE.test(u)) return null;
  if (!LANGS.includes(lang as Lang) || !DIFFICULTIES.includes(difficulty as Difficulty))
    return null;
  return { game, lang: lang as Lang, difficulty: difficulty as Difficulty, ulid: u };
}

/** results 테이블 키: PK = game#lang#difficulty#date, SK = ULID */
export function resultKeys(k: ResultKey) {
  return { pk: `${k.game}#${k.lang}#${k.difficulty}#${ulidDate(k.ulid)}`, sk: k.ulid };
}

// ─── commentId: {game}.{lang}.{ULID} | {game}.{lang}.{parentULID}.{ULID} ──

export type CommentKey = { game: string; lang: Lang; parent: string | null; ulid: string };

export function makeCommentId(k: CommentKey): string {
  return k.parent ? `${k.game}.${k.lang}.${k.parent}.${k.ulid}` : `${k.game}.${k.lang}.${k.ulid}`;
}

export function parseCommentId(id: string): CommentKey | null {
  const parts = id.split(".");
  const [game, lang] = parts;
  if (!game || !LANGS.includes(lang as Lang)) return null;
  const rest = parts.slice(2);
  if (!rest.length || rest.length > 2 || !rest.every((u) => ULID_RE.test(u))) return null;
  return rest.length === 1
    ? { game, lang: lang as Lang, parent: null, ulid: rest[0] as string }
    : { game, lang: lang as Lang, parent: rest[0] as string, ulid: rest[1] as string };
}

/** comments 테이블 키: 원댓글 PK = G#game#lang, 답글 PK = R#parentULID */
export function commentKeys(k: CommentKey) {
  return { pk: k.parent ? `R#${k.parent}` : `G#${k.game}#${k.lang}`, sk: k.ulid };
}
