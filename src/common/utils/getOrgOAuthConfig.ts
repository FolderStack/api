import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { config } from '@config';
import { dynamoDb } from './dynamodb';

export async function getOrgOAuthConfig(clientId: string) {
    const getOAuthInfo = new QueryCommand({
        TableName: config.tables.table,
        KeyConditionExpression: 'PK = :PK',
        FilterExpression: 'entityType = :entityType',
        ExpressionAttributeValues: marshall(
            {
                ':PK': `ClientID#${clientId}`,
                ':entityType': 'OAuthConfig',
            },
            { removeUndefinedValues: true }
        ),
    });

    const configResult = await dynamoDb.send(getOAuthInfo);

    let oauthConfig = configResult.Items?.[0] ?? null;
    if (!oauthConfig) return null;
    oauthConfig = unmarshall(oauthConfig);

    return oauthConfig;
}
