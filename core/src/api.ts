import { z } from "zod";
import { DIFFICULTIES, END_REASONS, LANGS, TIME_LIMIT_MS } from "./types";

const id = z
  .string()
  .regex(/^[a-z0-9_]+$/)
  .max(40);

// ─── 요청 ────────────────────────────────────────────────────────────────

export const ResultRequest = z.object({
  game: id,
  lang: z.enum(LANGS),
  difficulty: z.enum(DIFFICULTIES),
  rosterVer: z.number().int().min(1),
  endReason: z.enum(END_REASONS),
  totalMs: z.number().int().positive().max(TIME_LIMIT_MS),
  solves: z.record(id, z.number().int().positive().max(TIME_LIMIT_MS)),
});
export type ResultRequest = z.infer<typeof ResultRequest>;

export const ShareRequest = z.object({
  resultId: z.string().max(120),
  nickname: z.string().trim().min(1).max(12).optional(),
});
export type ShareRequest = z.infer<typeof ShareRequest>;

const body = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((s) => !/\n{4,}/.test(s), "too many line breaks");

export const CommentCreateRequest = z.object({
  nickname: z.string().trim().min(1).max(12),
  password: z.string().min(4).max(32),
  body,
  resultId: z.string().max(120).optional(),
});
export type CommentCreateRequest = z.infer<typeof CommentCreateRequest>;

export const CommentUpdateRequest = z.object({ password: z.string().min(4).max(32), body });
export type CommentUpdateRequest = z.infer<typeof CommentUpdateRequest>;

export const CommentDeleteRequest = z.object({ password: z.string().min(4).max(32) });
export type CommentDeleteRequest = z.infer<typeof CommentDeleteRequest>;

// ─── 응답 ────────────────────────────────────────────────────────────────

export type ResultResponse = { resultId: string };
export type ShareResponse = { shareId: string; url: string };
export type Page<T> = { items: T[]; nextCursor: string | null };

export type CommentRecord = {
  shareId: string;
  difficulty: (typeof DIFFICULTIES)[number];
  rosterVer: number;
  endReason: (typeof END_REASONS)[number];
  totalMs: number;
  solved: number;
  total: number;
};

export type Comment = {
  id: string;
  nickname: string;
  body: string;
  status: "active" | "deleted" | "removed";
  replyCount: number;
  likeCount: number;
  createdAt: string;
  editedAt: string | null;
  record: CommentRecord | null;
};

// ─── 에러 ────────────────────────────────────────────────────────────────

export const ERROR_STATUS = {
  INVALID_INPUT: 400,
  UNKNOWN_GAME: 400,
  UNKNOWN_ROSTER_VER: 400,
  WRONG_PASSWORD: 403,
  RESULT_NOT_FOUND: 404,
  SHARE_NOT_FOUND: 404,
  COMMENT_NOT_FOUND: 404,
  REPLY_DEPTH_EXCEEDED: 409,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL: 500,
} as const;
export type ErrorCode = keyof typeof ERROR_STATUS;

export type ApiError = { error: { code: ErrorCode; message: string; details?: unknown } };
