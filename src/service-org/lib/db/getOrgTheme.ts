import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb } from '@common/utils';
import { config } from '@config';

export async function getOrgTheme(orgId: string) {
    if (!orgId.startsWith('OrgID#')) {
        orgId = `OrgID#${orgId}`;
    }

    const getTheme = new GetItemCommand({
        TableName: config.tables.config,
        Key: marshall({
            PK: orgId,
            SK: `Theme`,
        }),
    });

    const result = await dynamoDb.send(getTheme);

    if (!result.Item) return null;
    return unmarshall(result.Item)?.theme ?? {};
}
