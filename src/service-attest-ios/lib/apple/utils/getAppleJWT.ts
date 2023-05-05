import jwt from 'jsonwebtoken';
import { PrivateKey, PrivateKeyId, TeamId } from '../../../constants';

export function getAppleJWT(): string {
    const header = {
        alg: 'ES256',
        kid: PrivateKeyId,
    };

    const payload = {
        iss: TeamId,
        iat: Math.floor(Date.now() / 1000),
    };

    const options: jwt.SignOptions = {
        algorithm: 'ES256',
        expiresIn: '20m',
        header,
    };

    const token = jwt.sign(payload, PrivateKey, options);
    return token;
}
