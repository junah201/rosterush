import type { CreateTableCommandInput } from "@aws-sdk/client-dynamodb";

/**
 * DynamoDB 테이블 정의.
 * 로컬(scripts/create-tables.ts)에서 사용. serverless.yml resources와 키 스키마를 맞출 것.
 */
const stage = process.env.STAGE ?? "local";
export const tableName = (base: string) => `rosterush-${stage}-${base}`;

export const TABLES = {
  results: tableName("results"),
  shares: tableName("shares"),
  comments: tableName("comments"),
  ratelimits: tableName("ratelimits"),
};

const pkSk = (name: string): CreateTableCommandInput => ({
  TableName: name,
  BillingMode: "PAY_PER_REQUEST",
  AttributeDefinitions: [
    { AttributeName: "pk", AttributeType: "S" },
    { AttributeName: "sk", AttributeType: "S" },
  ],
  KeySchema: [
    { AttributeName: "pk", KeyType: "HASH" },
    { AttributeName: "sk", KeyType: "RANGE" },
  ],
});

export const TABLE_DEFS: { input: CreateTableCommandInput; ttl?: string }[] = [
  { input: pkSk(TABLES.results), ttl: "expiresAt" },
  {
    input: {
      TableName: TABLES.shares,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [{ AttributeName: "shareId", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "shareId", KeyType: "HASH" }],
    },
  },
  { input: pkSk(TABLES.comments) },
  {
    input: {
      TableName: TABLES.ratelimits,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
    },
    ttl: "expiresAt",
  },
];
