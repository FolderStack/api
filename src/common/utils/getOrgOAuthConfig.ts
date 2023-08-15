import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { config } from '@config';
import { dynamoDb } from './dynamodb';

export async function getOrgOAuthConfig(hostName: string, clientId: string) {
    const getOAuthInfo = new QueryCommand({
        TableName: config.tables.table,
        KeyConditionExpression: 'PK = :PK',
        FilterExpression: 'entityType = :entityType AND clientId = :clientId',
        ExpressionAttributeValues: marshall({
            ':PK': `ClientID#${hostName}`,
            ':entityType': 'OAuthConfig',
            ':clientId': clientId,
        }),
    });

    const configResult = await dynamoDb.send(getOAuthInfo);

    let oauthConfig = configResult.Items?.[0] ?? null;
    if (!oauthConfig) return null;
    oauthConfig = unmarshall(oauthConfig);

    return oauthConfig;
}
