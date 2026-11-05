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

/** 댓글 본문: 줄바꿈을 \n으로 맞춘 뒤 앞뒤 공백 제거, 1~500자, 연속 줄바꿈 최대 3줄 */
const body = z
  .string()
  .transform((s) => s.replace(/\r\n?/g, "\n"))
  .pipe(
    z
      .string()
      .trim()
      .min(1)
      .max(500)
      .refine((s) => !/\n{4,}/.test(s), "too many line breaks"),
  );

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

/** shareId: 8자 base62 */
export const SHARE_ID_RE = /^[0-9A-Za-z]{8}$/;

/** GET /api/shares/{shareId} 응답. resultId(본인 확인용 비밀값)는 절대 포함하지 않는다 */
export type ShareView = {
  shareId: string;
  game: string;
  lang: (typeof LANGS)[number];
  difficulty: (typeof DIFFICULTIES)[number];
  rosterVer: number;
  endReason: (typeof END_REASONS)[number];
  totalMs: number;
  solved: number;
  total: number;
  /** 캐릭터 id → 맞힌 시각(ms) */
  solves: Record<string, number>;
  /** 공유 시점의 "상위 X%" (완주 + 같은 rosterVer + 표본 충분할 때만) */
  percentile: number | null;
  /** percentile을 계산한 집계 버전 (latest.json의 aggVersion) */
  aggVersion: string | null;
  nickname: string | null;
  createdAt: string;
};
export type Page<T> = { items: T[]; nextCursor: string | null };

/** 댓글에 첨부된 기록 요약. 백분위는 저장하지 않고 화면에서 latest.json으로 계산한다 */
export type CommentRecord = {
  shareId: string;
  /** 기록을 플레이한 언어 (댓글 언어와 다를 수 있음, latest.json 경로에 필요) */
  lang: (typeof LANGS)[number];
  difficulty: (typeof DIFFICULTIES)[number];
  rosterVer: number;
  endReason: (typeof END_REASONS)[number];
  totalMs: number;
  solved: number;
  total: number;
};

/**
 * 댓글 응답 객체 (pwHash, ipHash는 절대 포함하지 않는다).
 * status가 active가 아니면 nickname·body는 빈 문자열, record는 null.
 */
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

/** DELETE /api/comments/{id} 응답. 답글이 남은 원댓글은 soft(자리 유지), 그 외는 hard(사라짐) */
export type CommentDeleteResponse = { id: string; removed: "soft" | "hard" };

/** 댓글 목록 페이지 크기 */
export const COMMENT_PAGE_SIZE = 20;
export const REPLY_PAGE_SIZE = 50;

// ─── 에러 ────────────────────────────────────────────────────────────────

export const ERROR_STATUS = {
  INVALID_INPUT: 400,
  UNKNOWN_GAME: 400,
  UNKNOWN_ROSTER_VER: 400,
  // 403은 쓰지 않는다: CloudFront가 S3의 403(없는 객체)을 404 페이지로 바꾸는데, 이 설정이 API 응답에도 적용됨
  WRONG_PASSWORD: 401,
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
