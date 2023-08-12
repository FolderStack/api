import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { HttpNotFoundError } from '@common/errors';
import { dynamoDb, logger } from '@common/utils';
import { config } from '@config';
import { getOrgById } from './getOrgById';

export async function getOrgByName(name: string) {
    try {
        const queryOrgNameCommand = new QueryCommand({
            TableName: config.tables.table,
            // IndexName: 'entityTypeIndex',
            KeyConditionExpression: `PK = :name`,
            FilterExpression: `entityType = :entityType`,
            ExpressionAttributeValues: marshall({
                ':name': `OrgName#${name}`,
                ':entityType': 'OrganisationName',
            }),
        });

        const result = await dynamoDb.send(queryOrgNameCommand);
        const items = result?.Items?.map((item) => unmarshall(item));

        const orgId = items?.[0]?.SK;
        if (!orgId) throw new Error();

        return getOrgById(orgId);
    } catch (err) {
        logger.warn(err);
        throw new HttpNotFoundError();
    }
}
