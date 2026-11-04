import type { ApiError, ResultRequest, ResultResponse } from "@rosterush/core";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(res.status, err?.error.code ?? "INTERNAL");
  }
  return (await res.json()) as T;
}

export const postResult = (body: ResultRequest) => post<ResultResponse>("/api/results", body);
