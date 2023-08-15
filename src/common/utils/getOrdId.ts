import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { HttpUnauthorizedError } from '@common/errors';
import { config } from '@config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as JWT from 'jsonwebtoken';
import { dynamoDb } from './dynamodb';
import { getOrgOAuthConfig } from './getOrgOAuthConfig';

export async function getOrgFromEvent(event: APIGatewayProxyEvent) {
    let obj: any = event.requestContext.authorizer;
    let clientId: string | undefined = obj?.clientId;
    let hostName: string | undefined = obj?.hostName;

    if (config.isLocal) {
        let token =
            event.headers['Authorization'] ?? event.headers['authorization'];
        token = String(token).split('Bearer ')?.[1] ?? null;

        if (!token) {
            throw new HttpUnauthorizedError();
        }
        const data = JWT.decode(token) as JWT.JwtPayload;
        clientId = data.aud?.toString();
        hostName = event.headers['host'];
    }

    const oauthConfig = await getOrgOAuthConfig(hostName ?? '', clientId ?? '');
    if (!oauthConfig) return null;

    const getOrg = new QueryCommand({
        TableName: config.tables.table,
        KeyConditionExpression: 'PK = :PK',
        FilterExpression: 'entityType = :entityType',
        ExpressionAttributeValues: marshall({
            ':PK': oauthConfig.SK,
            ':entityType': 'Organisation',
        }),
    });

    const orgResult = await dynamoDb.send(getOrg);

    let org: Record<string, any> | null = orgResult.Items?.[0] ?? null;
    if (!org) return null;
    org = unmarshall(org);

    return {
        id: org.PK.split('#')[1],
        name: org.SK.split('#')[1],
    };
}
