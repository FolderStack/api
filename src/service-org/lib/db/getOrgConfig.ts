import { GetItemCommand, GetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb } from '@common/utils';
import { config } from '@config';

export async function getOrgConfig(orgId: string) {
    const getConfigParams: GetItemCommandInput = {
        TableName: config.tables.table,
        Key: marshall({
            PK: orgId,
            SK: `Config`,
        }),
    };

    const result = await dynamoDb.send(new GetItemCommand(getConfigParams));
    if (!result.Item) return null;
    return unmarshall(result.Item)?.config ?? {};
}
