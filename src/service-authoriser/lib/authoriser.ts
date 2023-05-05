import * as jwt from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';

export class Authoriser {
    constructor(
        private issuer: string,
        private jwksUri: string,
        private audience: string
    ) {}

    public async authorize(token: string): Promise<string | jwt.JwtPayload> {
        const decoded = jwt.decode(token, { complete: true });

        if (!decoded || !decoded?.header?.kid) {
            throw new Error('No key');
        }

        return this.getKey(decoded.header.kid as any).then((result) => {
            return this.verify(token, result);
        });
    }

    private getKey(kid: string): Promise<string> {
        const client = JwksRsa({ jwksUri: this.jwksUri });

        return new Promise((resolve, reject) => {
            client.getSigningKey(kid, (err, key) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!key) {
                    reject(new Error('No key'));
                    return;
                }

                resolve(key.getPublicKey());
            });
        });
    }

    private verify(
        token: string,
        cert: string
    ): Promise<string | jwt.JwtPayload> {
        const options = {
            audience: this.audience,
        };

        return new Promise((resolve, reject) => {
            jwt.verify(token, cert, options, (err, decoded) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!decoded) {
                    reject(new Error('No decode result'));
                    return;
                }

                resolve(decoded);
            });
        });
    }
}
