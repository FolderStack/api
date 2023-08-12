import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { HttpNotFoundError } from '@common/errors';
import { dynamoDb } from '@common/utils';
import { config } from '@config';

export async function getOrgById(id: string) {
    try {
        const getOrg = new QueryCommand({
            TableName: config.tables.table,
            KeyConditionExpression: `PK = :PK`,
            FilterExpression: 'entityType = :entityType',
            ExpressionAttributeValues: marshall({
                ':PK': `OrgID#${id}`,
                ':entityType': 'Organisation',
            }),
        });

        const orgOutput = await dynamoDb.send(getOrg);

        const result = orgOutput.Items?.[0];
        if (!result) throw new Error();

        const org = unmarshall(result);

        return {
            id,
            name: org.SK.split('#')[1],
        };
    } catch (err) {
        throw new HttpNotFoundError();
    }
}
