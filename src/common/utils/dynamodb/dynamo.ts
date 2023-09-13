import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const dynamoDb = new DynamoDBClient({
    region: process.env.REGION,
});

// export const dynamoDb = new DaxClient({
//     region: process.env.REGION,
//     dax: {
//         endpoints: [config.dax.endpoint],
//     },
// });
