import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { config } from '@config';
import { APIGatewayAuthorizerEvent } from 'aws-lambda';
import * as JWT from 'jsonwebtoken';
import { dynamoDb } from './dynamodb';
import { getOrgOAuthConfig } from './getOrgOAuthConfig';
import { logger } from './logger';

export async function getOrgFromAuthorizeEvent(
    event: APIGatewayAuthorizerEvent
) {
    if (event.type === 'TOKEN') {
        const token = event.authorizationToken.substring(7);

        logger.debug('getOrgFromAuthorizeEvent: token:', { token });
        const data = JWT.decode(token) as JWT.JwtPayload;

        logger.debug('getOrgFromAuthorizeEvent: payload:', { data });
        const clientId = String(data.aud);

        const oauthConfig = (await getOrgOAuthConfig(clientId ?? '')) as any;
        logger.debug('getOrgFromAuthorizeEvent: oauthconfig:', {
            oauthConfig,
        });

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

        oauthConfig.clientId = oauthConfig.PK.split('#')[1];
        oauthConfig.orgId = oauthConfig.SK.split('#')[1];

        delete oauthConfig.PK;
        delete oauthConfig.SK;

        const orgResult = await dynamoDb.send(getOrg);

        let org: Record<string, any> | null = orgResult.Items?.[0] ?? null;
        logger.debug('getOrgFromAuthorizeEvent: org:', { org });

        if (!org) return null;
        org = unmarshall(org);

        return {
            id: org.PK.split('#')[1],
            name: org.SK.split('#')[1],
            oauthConfig,
        };
    }
    return null;
}
