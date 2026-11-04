/**
 * 로컬 DynamoDB 테이블 내용 출력 (디버깅용).
 * 사용: pnpm --filter @rosterush/api db:scan [results|shares|comments|ratelimits]
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "../src/lib/tables";

const name = (process.argv[2] ?? "results") as keyof typeof TABLES;
const table = TABLES[name];
if (!table) {
  console.error(`unknown table: ${name} (${Object.keys(TABLES).join(", ")})`);
  process.exit(2);
}

const doc = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    endpoint: process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000",
    region: "ap-northeast-2",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  }),
);

const { Items = [] } = await doc.send(new ScanCommand({ TableName: table }));
console.log(`${table}: ${Items.length} item(s)`);
for (const item of Items) console.log(JSON.stringify(item));
