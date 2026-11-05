import type {
  ApiError,
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

const post = <T>(path: string, body: unknown) =>
  request<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

export const postResult = (body: ResultRequest) => post<ResultResponse>("/api/results", body);

/** 같은 기록을 다시 보내면 처음 만든 링크가 그대로 돌아온다 (닉네임도 처음 값 유지) */
export const postShare = (body: ShareRequest) => post<ShareResponse>("/api/shares", body);

export const getShare = (shareId: string) =>
  request<ShareView>(`/api/shares/${encodeURIComponent(shareId)}`);
