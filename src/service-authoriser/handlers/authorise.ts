import { APIGatewayAuthorizerEvent, Context } from 'aws-lambda';
import { AWSPolicyGenerator, Authoriser } from '../lib';
import { getOrgFromEvent } from '@common/utils';
import { getOrgConfig } from '../../service-org/lib/db';

export async function handler(
    event: APIGatewayAuthorizerEvent,
    _context: Context,
    cb: CallableFunction
) {
    try {
        if (event.type === 'TOKEN') {
            const org = await getOrgFromEvent(event);
            const config = await getOrgConfig(org.id);

            const { audience, jwks, issuer } = config;

            if (!audience) {
                throw new Error('Bad configuration');
            }

            if (!jwks) {
                throw new Error('Bad configuration');
            }

            if (!issuer) {
                throw new Error('Bad configuration');
            }

            const token = event.authorizationToken.substring(7);
            const client = new Authoriser(issuer, jwks, audience);

            client
                .authorize(token)
                .then((result) => {
                    if (typeof result === 'string') {
                        return cb('Internal Server Error');
                    }
                    const policy = AWSPolicyGenerator.generate(
                        result.sub!,
                        'Allow',
                        event.methodArn,
                        result
                    );
                    return cb(null, policy);
                })
                .catch((err) => {
                    //logger.info(err);
                    cb('Unauthorized');
                });
        }
    } catch (err) {
        //logger.info(err);
        cb('Internal Server Error');
    }
    cb('Unauthorized');
}
