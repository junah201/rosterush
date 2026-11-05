import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "./dynamo";
import { HttpError } from "./http";
import { TABLES } from "./tables";

/**
 * IP별 요청 제한 (ratelimits 테이블).
 * 키 = {이름}#{ipHash}#{구간 번호}, 원자적 ADD로 세고 구간이 끝나면 TTL로 지운다.
 */
export type Window = { sec: number; max: number };

const bucket = (now: number, sec: number) => Math.floor(now / 1000 / sec);
const retryAfter = (now: number, sec: number) => sec - (Math.floor(now / 1000) % sec);
const keyOf = (name: string, ip: string, sec: number, now: number) =>
  `${name}#${ip}#${sec}#${bucket(now, sec)}`;

function limited(sec: number, now: number): HttpError {
  return new HttpError("RATE_LIMITED", "too many requests", undefined, {
    "retry-after": String(retryAfter(now, sec)),
  });
}

async function add(pk: string, sec: number, now: number): Promise<number> {
  const { Attributes } = await ddb.send(
    new UpdateCommand({
      TableName: TABLES.ratelimits,
      Key: { pk },
      UpdateExpression: "ADD n :one SET expiresAt = if_not_exists(expiresAt, :exp)",
      ExpressionAttributeValues: {
        ":one": 1,
        ":exp": (bucket(now, sec) + 1) * sec + 60,
      },
      ReturnValues: "UPDATED_NEW",
    }),
  );
  return (Attributes?.n as number | undefined) ?? 1;
}

/** 한 번 세고, 어느 구간이든 한도를 넘으면 429 */
export async function hit(name: string, ip: string, windows: Window[], now = Date.now()) {
  const counts = await Promise.all(
    windows.map((w) => add(keyOf(name, ip, w.sec, now), w.sec, now)),
  );
  const over = windows.find((w, i) => (counts[i] ?? 0) > w.max);
  if (over) throw limited(over.sec, now);
}

/** 세지 않고 이미 한도에 닿았는지만 본다 (비밀번호 실패처럼 실패할 때만 세는 경우) */
export async function assertUnder(name: string, ip: string, w: Window, now = Date.now()) {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.ratelimits, Key: { pk: keyOf(name, ip, w.sec, now) } }),
  );
  if (((Item?.n as number | undefined) ?? 0) >= w.max) throw limited(w.sec, now);
}

export async function count(name: string, ip: string, w: Window, now = Date.now()) {
  await add(keyOf(name, ip, w.sec, now), w.sec, now);
}

/** 9장 IP별 한도 */
export const LIMITS = {
  /** 댓글/답글 작성: 1분 5회, 1시간 30회 */
  commentWrite: [
    { sec: 60, max: 5 },
    { sec: 3600, max: 30 },
  ],
  /** 비밀번호 실패: 댓글 하나당 같은 IP에서 10분에 5회 */
  passwordFail: { sec: 600, max: 5 },
} satisfies Record<string, Window | Window[]>;
