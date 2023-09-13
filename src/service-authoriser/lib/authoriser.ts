import { logger } from '@common/utils';
import * as jwt from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';

export class Authoriser {
    constructor(
        private issuer: string,
        private jwksUri: string,
        private audience: string
    ) {}

    public async authorize(token: string): Promise<string | jwt.JwtPayload> {
        try {
            logger.debug('authorize: ', { token });
            const decoded = jwt.decode(token, { complete: true });
            logger.debug('authorize: ', { decoded });

            if (!decoded || !decoded?.header?.kid) {
                logger.debug('authorize err:', 'no key', { decoded, token });
                throw new Error('No key');
            }

            return this.getKey(decoded.header.kid as any)
                .then((result) => {
                    logger.debug('authorize result:', result);
                    return this.verify(token, result);
                })
                .catch((err) => {
                    logger.debug('authorize err:', err);
                    throw err;
                });
        } catch (err) {
            logger.debug('authorize err:', err);
            throw err;
        }
    }

    private async getKey(kid: string): Promise<string> {
        try {
            const client = JwksRsa({ jwksUri: this.jwksUri });
            const signingKey = await client.getSigningKey(kid);
            if (!signingKey) {
                logger.debug('no key??');
                throw new Error('no key?');
            }

            return signingKey.getPublicKey();
        } catch (err) {
            console.log(err);
            throw new Error('Error occured');
        }
    }

    private verify(token: string, cert: string): string | jwt.JwtPayload {
        try {
            const options = {
                audience: this.audience,
            };

            const decoded = jwt.verify(token, cert, options);
            return decoded;
        } catch (err) {
            logger.debug('Failed to decode', { err });
            throw err;
        }
    }
}
