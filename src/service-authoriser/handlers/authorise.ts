import { APIGatewayAuthorizerEvent, Context } from 'aws-lambda';
import { AWSPolicyGenerator, Authoriser } from '../lib';

const AUDIENCE = process.env.AUDIENCE;
const JWKS_URI = process.env.JWKS_URI;
const TOKEN_ISSUER = process.env.TOKEN_ISSUER;

export function handler(
    event: APIGatewayAuthorizerEvent,
    _context: Context,
    cb: CallableFunction
) {
    try {
        if (event.type === 'TOKEN') {
            if (!AUDIENCE) {
                //logger.debug(
                //     `Audience not configured in env vars.
                //     Expected 'AUDIENCE' to be set.`
                // );
                throw new Error('Bad configuration');
            }

            if (!JWKS_URI) {
                //logger.debug(
                //     `JWKS uri not configured in env vars.
                //     Expected 'JWKS_URI' to be set.`
                // );
                throw new Error('Bad configuration');
            }

            if (!TOKEN_ISSUER) {
                //logger.debug(
                //     `Token issuer not configured in env vars.
                //     Expected 'TOKEN_ISSUER' to be set.`
                // );
                throw new Error('Bad configuration');
            }

            const token = event.authorizationToken.substring(7);
            const client = new Authoriser(TOKEN_ISSUER, JWKS_URI, AUDIENCE);

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
