import { Ok } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import { OrgDb } from '../lib';

export async function getConfigHandler(event: APIGatewayProxyEventWithOrg) {
    const config = await OrgDb.getOrgConfig(event.org.id);
    const theme = await OrgDb.getOrgTheme(event.org.id);

    return Ok({
        org: event.org,
        config,
        theme,
    });
}

export const handler = withErrorWrapper(withOrgWrapper(getConfigHandler));
