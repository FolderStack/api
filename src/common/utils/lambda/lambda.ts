import { LambdaClient } from '@aws-sdk/client-lambda';

export const lambda = new LambdaClient({
    region: process.env.REGION,
});
