import { HttpError, HttpInternalServerError } from '@common/errors';
import { Ok } from '@common/responses';
import { getOrgIdFromEvent, logger } from '@common/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { OrgDb } from '../lib';
import { getOrgById } from '../lib/db/getOrgById';

export async function handler(event: APIGatewayProxyEvent) {
    try {
        const orgId = getOrgIdFromEvent(event);
        const org = await getOrgById(orgId);
        const config = await OrgDb.getOrgConfig(orgId);
        const theme = await OrgDb.getOrgTheme(orgId);

        return Ok({
            org: {
                id: orgId,
                name: org.name,
            },
            config,
            theme,
        });
    } catch (err) {
        logger.debug(err);
        if (err instanceof HttpError) {
            return err.toResponse();
        }
        return new HttpInternalServerError().toResponse();
    }
}
