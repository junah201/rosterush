import type {
  ApiError,
  Comment,
  CommentCreateRequest,
  CommentDeleteRequest,
  CommentDeleteResponse,
  CommentUpdateRequest,
  Lang,
  Page,
  ResultRequest,
  ResultResponse,
  ShareRequest,
  ShareResponse,
  ShareView,
} from "@rosterush/core";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(res.status, err?.error.code ?? "INTERNAL");
  }
  return (await res.json()) as T;
}

const send = <T>(method: "POST" | "PATCH" | "DELETE", path: string, body: unknown) =>
  request<T>(path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const withCursor = (path: string, cursor?: string | null) =>
  cursor ? `${path}?cursor=${encodeURIComponent(cursor)}` : path;

const enc = encodeURIComponent;

export const postResult = (body: ResultRequest) =>
  send<ResultResponse>("POST", "/api/results", body);

/** 같은 기록을 다시 보내면 처음 만든 링크가 그대로 돌아온다 (닉네임도 처음 값 유지) */
export const postShare = (body: ShareRequest) => send<ShareResponse>("POST", "/api/shares", body);

export const getShare = (shareId: string) => request<ShareView>(`/api/shares/${enc(shareId)}`);

// ─── 댓글 ────────────────────────────────────────────────────────────────

const gamePath = (game: string, lang: Lang) => `/api/games/${enc(game)}/${lang}/comments`;

/** 원댓글 최신순 */
export const listComments = (game: string, lang: Lang, cursor?: string | null) =>
  request<Page<Comment>>(withCursor(gamePath(game, lang), cursor), { cache: "no-store" });

export const createComment = (game: string, lang: Lang, body: CommentCreateRequest) =>
  send<Comment>("POST", gamePath(game, lang), body);

/** 답글 오래된 순 */
export const listReplies = (commentId: string, cursor?: string | null) =>
  request<Page<Comment>>(withCursor(`/api/comments/${enc(commentId)}/replies`, cursor), {
    cache: "no-store",
  });

export const createReply = (commentId: string, body: CommentCreateRequest) =>
  send<Comment>("POST", `/api/comments/${enc(commentId)}/replies`, body);

export const updateComment = (commentId: string, body: CommentUpdateRequest) =>
  send<Comment>("PATCH", `/api/comments/${enc(commentId)}`, body);

export const deleteComment = (commentId: string, body: CommentDeleteRequest) =>
  send<CommentDeleteResponse>("DELETE", `/api/comments/${enc(commentId)}`, body);
