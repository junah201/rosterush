import { createHmac } from "node:crypto";
import { type ApiError, ERROR_STATUS, type ErrorCode } from "@rosterush/core";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import type { z } from "zod";

export type Event = APIGatewayProxyEventV2;
export type Response = APIGatewayProxyStructuredResultV2;

const MAX_BODY = 16 * 1024;

export class HttpError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return {
    statusCode: status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
    body: JSON.stringify(body),
  };
}

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) {
    const body: ApiError = { error: { code: e.code, message: e.message, details: e.details } };
    return json(ERROR_STATUS[e.code], body);
  }
  console.error(e);
  return json(500, { error: { code: "INTERNAL", message: "internal error" } } satisfies ApiError);
}

/** 본문 JSON 파싱 + zod 검증 */
export function parseBody<T extends z.ZodType>(event: Event, schema: T): z.infer<T> {
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body ?? "", "base64").toString()
    : (event.body ?? "");
  if (raw.length > MAX_BODY) throw new HttpError("PAYLOAD_TOO_LARGE", "body too large");
  let data: unknown;
  try {
    data = JSON.parse(raw || "null");
  } catch {
    throw new HttpError("INVALID_INPUT", "invalid json");
  }
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError("INVALID_INPUT", "validation failed", r.error.issues);
  return r.data;
}

/** CloudFront를 거치지 않은 직접 호출 차단 */
export function assertFromCloudFront(event: Event) {
  const secret = process.env.ORIGIN_VERIFY_SECRET;
  if (secret && event.headers["x-origin-verify"] !== secret) {
    throw new HttpError("INVALID_INPUT", "direct access not allowed");
  }
}

/** 실제 사용자 IP → HMAC 해시 */
export function ipHash(event: Event): string {
  const viewer = event.headers["cloudfront-viewer-address"]; // "1.2.3.4:5678" 또는 "[::1]:5678"
  const ip = viewer
    ? viewer.replace(/:\d+$/, "").replace(/^\[|\]$/g, "")
    : event.requestContext.http.sourceIp;
  return createHmac("sha256", process.env.IP_HASH_SECRET ?? "dev")
    .update(ip)
    .digest("hex")
    .slice(0, 32);
}

/** 핸들러 래퍼: 에러를 표준 응답으로 변환 */
export const handler =
  (fn: (event: Event) => Promise<Response>) =>
  async (event: Event): Promise<Response> => {
    try {
      assertFromCloudFront(event);
      return await fn(event);
    } catch (e) {
      return errorResponse(e);
    }
  };
