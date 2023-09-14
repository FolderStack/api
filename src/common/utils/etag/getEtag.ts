import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { config } from '@config';
import { dynamoDb } from '../dynamodb';
import { md5 } from './md5';

export async function getEtag(etagKey: string, orgId: string) {
    const result = await dynamoDb.send(
        new GetItemCommand({
            TableName: config.tables.caching,
            Key: marshall({
                PK: `ETag#${md5(etagKey)}`,
                SK: `OrgID#${orgId}`,
            }),
        })
    );

    return result?.Item ? unmarshall(result.Item) : null;
}
