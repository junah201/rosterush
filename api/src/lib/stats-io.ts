import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { AggState, LatestStats } from "@rosterush/core";
import type { RunSource, StatsStore, StoredRun } from "./aggregate-job";

// ─── 결과 테이블 조회 ────────────────────────────────────────────────────

export function dynamoRunSource(ddb: DynamoDBDocumentClient, table: string): RunSource {
  return {
    async *query(pk, fromSk, toSk) {
      let start: Record<string, unknown> | undefined;
      do {
        const page = await ddb.send(
          new QueryCommand({
            TableName: table,
            KeyConditionExpression: "pk = :pk AND sk BETWEEN :from AND :to",
            ExpressionAttributeValues: { ":pk": pk, ":from": fromSk, ":to": toSk },
            ProjectionExpression: "sk, rosterVer, endReason, totalMs, solves, flagged",
            ExclusiveStartKey: start,
          }),
        );
        for (const item of page.Items ?? []) yield item as StoredRun;
        start = page.LastEvaluatedKey;
      } while (start);
    },
  };
}

// ─── 저장소 ──────────────────────────────────────────────────────────────

const CACHE = {
  latest: "public, max-age=3600",
  snapshot: "public, max-age=31536000, immutable",
} as const;

const stateKey = (prefix: string) => `internal/${prefix}/state.json`;

/** S3: state는 internal/ (비공개), 공개 JSON은 stats/ (CloudFront로 노출) */
export function s3StatsStore(s3: S3Client, bucket: string): StatsStore {
  return {
    async getState(prefix) {
      try {
        const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: stateKey(prefix) }));
        const text = await res.Body?.transformToString();
        return text ? (JSON.parse(text) as AggState) : null;
      } catch (e) {
        if (e instanceof NoSuchKey) return null;
        throw e;
      }
    },
    async putState(prefix, state) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: stateKey(prefix),
          Body: JSON.stringify(state),
          ContentType: "application/json",
        }),
      );
    },
    async putPublic(path, body: LatestStats, kind) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: path,
          Body: JSON.stringify(body),
          ContentType: "application/json",
          CacheControl: CACHE[kind],
        }),
      );
    },
  };
}

/** 로컬: state는 internalDir, 공개 JSON은 publicDir (web/public → next dev가 /stats/로 서빙) */
export function fsStatsStore(internalDir: string, publicDir: string): StatsStore {
  const write = async (file: string, body: unknown) => {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(body, null, 2)}\n`);
  };
  return {
    async getState(prefix) {
      try {
        return JSON.parse(await readFile(join(internalDir, stateKey(prefix)), "utf8")) as AggState;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw e;
      }
    },
    putState: (prefix, state) => write(join(internalDir, stateKey(prefix)), state),
    putPublic: (path, body) => write(join(publicDir, path), body),
  };
}

export { S3Client };
