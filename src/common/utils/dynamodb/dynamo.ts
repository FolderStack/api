import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const dynamoDb = new DynamoDBClient({
    region: process.env.REGION,
    // endpoint: config.isLocal ? 'http://localhost:8000' : undefined,
    // credentials: {
    //     accessKeyId: 'AKIA5BGXLMMYXKAAZIM3',
    //     secretAccessKey: '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',
    // },
    // dax: {
    //     requestTimeout: 60000,
    //     endpoints: [config.dax.endpoint],
    // },
});
