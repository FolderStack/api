import { HttpError, HttpInternalServerError } from '@common/errors';
import { Ok } from '@common/responses';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { getConfig } from '../lib/config';
import { getOrgByName } from '../lib/org';
import { getTheme } from '../lib/theme';

export async function handler(event: APIGatewayProxyEvent) {
    try {
        const body = JSON.parse(event.body ?? '{}');
        const orgName = body.org;

        const org = await getOrgByName(orgName);
        const config = await getConfig(org.id);
        const theme = await getTheme(org.id);

        return Ok({
            config: {
                ...config,
                branding: org.branding,
            },
            theme,
        });
    } catch (err) {
        if (err instanceof HttpError) {
            return err.toResponse();
        }
        return new HttpInternalServerError().toResponse();
    }
}
