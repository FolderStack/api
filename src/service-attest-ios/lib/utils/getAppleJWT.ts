import jwt from 'jsonwebtoken';

export function getAppleJWT(keyId: string, teamId: string, privateKey: string): string {
    const header = {
        alg: 'ES256',
        kid: keyId,
    };

    const payload = {
        iss: teamId,
        iat: Math.floor(Date.now() / 1000),
    };

    const options: jwt.SignOptions = {
        algorithm: 'ES256',
        expiresIn: '20m',
        header,
    };

    const token = jwt.sign(payload, privateKey, options);
    return token;
}
