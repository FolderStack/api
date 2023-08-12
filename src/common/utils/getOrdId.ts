import { HttpUnauthorizedError } from '@common/errors';
import { config } from '@config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

export function getOrgIdFromEvent(event: APIGatewayProxyEvent) {
    let obj: any = event.requestContext.authorizer;
    if (config.isLocal) {
        let test;
        try {
            test = JSON.parse(
                event.headers['X-Test-Authorizer'] ??
                    event.headers['x-test-authorizer'] ??
                    '{}'
            );
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

    console.log('OrgId', orgOption.value);
    return orgOption.value;
}
