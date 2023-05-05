import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { isLocal } from '../../../config';

export const dynamoDb = new DynamoDBClient({
    region: process.env.REGION,
    endpoint: isLocal ? 'http://localhost:8000' : undefined,
});
