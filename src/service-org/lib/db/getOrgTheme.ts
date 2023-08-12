import { GetItemCommand, GetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb } from '@common/utils';
import { config } from '@config';

export async function getOrgTheme(orgId: string) {
    const getThemeParams: GetItemCommandInput = {
        TableName: config.tables.table,
        Key: marshall({
            PK: orgId,
            SK: `Theme`,
        }),
    };

    const result = await dynamoDb.send(new GetItemCommand(getThemeParams));
    if (!result.Item) return null;
    return unmarshall(result.Item)?.theme ?? {};
}
