import { HttpUnauthorizedError } from '@common/errors';
import { config } from '@config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { logger } from './logger';

export function getOrgId(event: APIGatewayProxyEvent) {
    let obj: any = event.requestContext.authorizer;
    if (config.isLocal) {
        let test;
        try {
            test = JSON.parse(event.headers['X-Test-Authorizer'] ?? '{}');
        } catch (err) {
            // ignored...
        }
        obj = Object.keys(test).length > 0 ? test : obj;
    }

    const orgOption = pipe(
        O.fromNullable(obj?.orgId),
        O.filter((org: any) => typeof org === 'string' && org !== '')
    );

    if (O.isNone(orgOption)) {
        throw new HttpUnauthorizedError();
    }

    logger.debug('Org: ' + orgOption.value);
    return orgOption.value;
}
