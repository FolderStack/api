import { logger } from '@common/utils';
import { getOrgFromAuthorizeEvent } from '@common/utils/getOrgFromAuthorizeEvent';
import { config } from '@config';
import {
    APIGatewayAuthorizerEvent,
    APIGatewayAuthorizerResult,
    Callback,
    Context,
} from 'aws-lambda';
import { AWSPolicyGenerator, Authoriser } from '../lib';

export async function handler(
    event: APIGatewayAuthorizerEvent,
    _context: Context,
    cb: Callback<APIGatewayAuthorizerResult>
) {
    if (config.isLocal) {
        const policy = AWSPolicyGenerator.generate('0', 'Allow', `*`, {});
        cb(undefined, policy);
        return;
    }

    try {
        if (event.type === 'TOKEN') {
            const org = await getOrgFromAuthorizeEvent(event);
            if (!org) {
                logger.debug('No org');
                throw new Error('Org not extracted');
            }

            const { jwks, issuer } = org.oauthConfig;

            if (!jwks) {
                logger.debug('No jwks');
                throw new Error('Bad configuration');
            }

            if (!issuer) {
                logger.debug('No issuer');
                throw new Error('Bad configuration');
            }

            // The audience is special because it's the client id.
            const audience = org.oauthConfig.clientId;

            const token = event.authorizationToken.substring(7);
            logger.debug({ token, issuer, jwks, audience });
            const client = new Authoriser(issuer, jwks, audience);

            const result = await client.authorize(token);
            logger.debug({ result });
            if (typeof result === 'string') {
                return cb('Internal Server Error');
            }

            const context = {
                ...result,
                clientId: result.aud,
            };

            logger.debug({ context });

            if (!String(result.sub)) {
                cb('Forbidden');
            }

            const policy = AWSPolicyGenerator.generate(
                result.sub!,
                'Allow',
                // TODO: Update this to target functions better.
                // This is currently a wildcard for authorization caching...
                '*',
                context
            );

            cb(undefined, policy);
        } else {
            logger.debug('Unauthorized');
            cb('Unauthorized');
        }
    } catch (err) {
        console.log(err);
        logger.debug('Internal server error');
        logger.debug({ err });
        cb('Unauthorized');
    }
}
