import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { HttpNotFoundError } from '@common/errors';
import { dynamoDb, logger } from '@common/utils';
import { config } from '@config';

export async function getOrgById(id: string) {
    try {
        const getOrg = new GetItemCommand({
            TableName: config.tables.table,
            Key: marshall({
                PK: `OrgID#${id}`,
                SK: `OrgName#${name}`,
            }),
        });

        const orgOutput = await dynamoDb.send(getOrg);

        if (!orgOutput?.Item) throw new Error();

        return unmarshall(orgOutput.Item);
    } catch (err) {
        logger.warn(err);
        throw new HttpNotFoundError();
    }
}
