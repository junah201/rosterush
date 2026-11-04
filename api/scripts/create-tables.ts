/**
 * 로컬 DynamoDB에 테이블 생성 (이미 있으면 건너뜀).
 * 사용: pnpm --filter @rosterush/api db:up && pnpm --filter @rosterush/api db:init
 */
import {
  CreateTableCommand,
  DynamoDBClient,
  ListTablesCommand,
  UpdateTimeToLiveCommand,
} from "@aws-sdk/client-dynamodb";
import { TABLE_DEFS } from "../src/lib/tables";

const ddbClient = new DynamoDBClient({
  endpoint: process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000",
  region: "ap-northeast-2",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

const existing = new Set((await ddbClient.send(new ListTablesCommand({}))).TableNames ?? []);

for (const { input, ttl } of TABLE_DEFS) {
  const name = input.TableName as string;
  if (existing.has(name)) {
    console.log(`= ${name} (이미 있음)`);
    continue;
  }
  await ddbClient.send(new CreateTableCommand(input));
  if (ttl) {
    await ddbClient.send(
      new UpdateTimeToLiveCommand({
        TableName: name,
        TimeToLiveSpecification: { AttributeName: ttl, Enabled: true },
      }),
    );
  }
  console.log(`+ ${name}`);
}
