import { SQSClient } from '@aws-sdk/client-sqs';
import { isLocal } from '../../../config';

export const sqs = new SQSClient({
    region: process.env.REGION,
    endpoint: isLocal ? 'http://localhost:9324' : undefined,
});
