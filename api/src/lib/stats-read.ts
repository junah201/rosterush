import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { GetObjectCommand, NoSuchKey, S3Client } from "@aws-sdk/client-s3";
import type { Difficulty, Lang, LatestStats } from "@rosterush/core";

/** Lambda 인스턴스가 살아 있는 동안 latest.json을 잠깐 캐시 (집계는 주 2회라 충분) */
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; value: LatestStats | null }>();
let s3: S3Client | undefined;

async function load(path: string): Promise<LatestStats | null> {
  // 로컬: STATS_DIR (web/public) 에서 읽기
  const dir = process.env.STATS_DIR;
  if (dir) {
    try {
      return JSON.parse(await readFile(join(dir, path), "utf8")) as LatestStats;
    } catch {
      return null;
    }
  }

  const bucket = process.env.STATS_BUCKET;
  if (!bucket) return null;
  s3 ??= new S3Client({});
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: path }));
    const text = await res.Body?.transformToString();
    return text ? (JSON.parse(text) as LatestStats) : null;
  } catch (e) {
    if (e instanceof NoSuchKey) return null;
    throw e;
  }
}

/** 공유 시점 백분위 계산용 latest.json. 없으면 null */
export async function getLatestStats(
  game: string,
  lang: Lang,
  difficulty: Difficulty,
): Promise<LatestStats | null> {
  const path = `stats/${game}/${lang}/${difficulty}/latest.json`;
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = await load(path);
  cache.set(path, { at: Date.now(), value });
  return value;
}
