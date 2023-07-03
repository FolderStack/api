import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { config } from '../../../config';

const credentials = config.isLocal
    ? {
          accessKeyId: config.constants.aws.accessKeyId,
          secretAccessKey: config.constants.aws.secretAccessKey,
      }
    : undefined;

export const dynamoDb = new DynamoDBClient({
    region: process.env.REGION,
    // endpoint: config.isLocal ? 'http://localhost:8000' : undefined
    credentials,
});
