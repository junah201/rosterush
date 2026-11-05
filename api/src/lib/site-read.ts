import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { GetObjectCommand, NoSuchKey, S3Client } from "@aws-sdk/client-s3";

/**
 * 웹 정적 export 결과물(SiteBucket)에서 HTML 파일을 읽는다.
 * 웹 배포는 CloudFront 전체 무효화를 하므로, 여기서는 잠깐만 캐시한다.
 */
const TTL_MS = 60 * 1000;
const cache = new Map<string, { at: number; value: string | null }>();
let s3: S3Client | undefined;

async function load(path: string): Promise<string | null> {
  // 로컬: SITE_DIR (web/out) 에서 읽기
  const dir = process.env.SITE_DIR;
  if (dir) {
    try {
      return await readFile(join(dir, path), "utf8");
    } catch {
      return null;
    }
  }

  const bucket = process.env.SITE_BUCKET;
  if (!bucket) return null;
  s3 ??= new S3Client({});
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: path }));
    return (await res.Body?.transformToString("utf-8")) ?? null;
  } catch (e) {
    if (e instanceof NoSuchKey) return null;
    throw e;
  }
}

/** 예: "ko/s/index.html". 없으면 null */
export async function getSiteFile(path: string): Promise<string | null> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = await load(path);
  cache.set(path, { at: Date.now(), value });
  return value;
}
