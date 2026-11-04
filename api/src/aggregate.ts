import { games } from "@rosterush/games";
import { aggregateAll } from "./lib/aggregate-job";
import { ddb } from "./lib/dynamo";
import { dynamoRunSource, S3Client, s3StatsStore } from "./lib/stats-io";
import { TABLES } from "./lib/tables";

/** 스케줄 집계 (EventBridge) — 모든 게임 × 언어 × 난이도를 증분 집계해 S3에 쓴다 */
export const main = async () => {
  const bucket = process.env.STATS_BUCKET;
  if (!bucket) throw new Error("STATS_BUCKET is not set");

  const results = await aggregateAll({
    games,
    now: Date.now(),
    minSample: Number(process.env.MIN_SAMPLE ?? 100),
    source: dynamoRunSource(ddb, TABLES.results),
    store: s3StatsStore(new S3Client({}), bucket),
  });

  const added = results.reduce((a, r) => a + r.added, 0);
  console.log(JSON.stringify({ combos: results.length, added, results }));
  return { combos: results.length, added };
};
