import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb, logger } from '@common/utils';
import { config } from '@config';

export async function getOrgConfig(orgId: string) {
    if (!orgId.startsWith('OrgID#')) {
        orgId = `OrgID#${orgId}`;
    }

    logger.debug(`getOrgConfig: ${orgId}`);

    const getConfig = new GetItemCommand({
        TableName: config.tables.table,
        Key: marshall({
            PK: orgId,
            SK: `Config`,
        }),
    });

    const result = await dynamoDb.send(getConfig);

    if (!result.Item) return null;
    return unmarshall(result.Item)?.config ?? {};
}
