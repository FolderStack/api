import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { config } from '@config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { dynamoDb } from './dynamodb';
import { getOrgOAuthConfig } from './getOrgOAuthConfig';
import { logger } from './logger';

export async function getOrgFromEvent(event: APIGatewayProxyEvent) {
    let orgPK: string | undefined;
    if (config.isLocal) {
        logger.debug('getOrgFromEvent', 'isLocal');
        const localInfo = event.headers['X-Test-Authorizer'];
        try {
            const orgId = JSON.parse(localInfo ?? '')?.orgId;
            if (orgId && typeof orgId === 'string') {
                orgPK = `OrgID#${orgId}`;
            } else {
                logger.debug(
                    'Failed to extract orgId from X-Test-Authorizer header',
                    { localInfo }
                );
                return null;
            }
        } catch (err) {
            logger.debug('Failed to parse X-Test-Authorizer header');
            return null;
        }
    } else {
        let obj: any = event.requestContext.authorizer;
        let clientId: string = obj?.clientId ?? '';

        logger.debug('getOrgFromEvent', {
            clientId,
            ctx: event.requestContext,
        });

        const oauthConfig = await getOrgOAuthConfig(clientId ?? '');
        if (!oauthConfig) return null;
        orgPK = oauthConfig.SK as unknown as string;
    }

    const getOrg = new QueryCommand({
        TableName: config.tables.table,
        KeyConditionExpression: 'PK = :PK',
        FilterExpression: 'entityType = :entityType',
        ExpressionAttributeValues: marshall({
            ':PK': orgPK,
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
