import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const endpoint = process.env.DYNAMODB_ENDPOINT;

export const ddbClient = new DynamoDBClient(
  endpoint
    ? {
        endpoint,
        region: "ap-northeast-2",
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }
    : {},
);

export const ddb = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});
