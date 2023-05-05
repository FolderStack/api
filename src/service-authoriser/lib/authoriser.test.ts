import { Authoriser } from './authoriser';
import * as jwt from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';

const jwtMock = jwt as jest.Mocked<typeof jwt>;
const jwksRsaMock = JwksRsa as unknown as jest.Mock<typeof JwksRsa>;

jest.mock('jsonwebtoken');
jest.mock('jwks-rsa');

describe('Authoriser', () => {
    const issuer = 'test-issuer';
    const jwksUri = 'https://test-jwks-uri';
    const audience = 'test-audience';
    const publicKey = 'test-public-key';
    const token = 'test-token';
    const kid = 'test-kid';
    const decodedPayload = { sub: 'test-sub' };

    let authoriser: Authoriser;

    beforeEach(() => {
        authoriser = new Authoriser(issuer, jwksUri, audience);
        jwtMock.decode.mockClear();
        jwksRsaMock.mockClear();
        jwtMock.verify.mockClear();
    });

    it('should successfully authorize a token', async () => {
        jwtMock.decode.mockReturnValue({ header: { kid } });
        jwksRsaMock.mockImplementation(
            () =>
                ({
                    getSigningKey: (
                        kid: string,
                        callback: (err: Error | null, key: any) => void
                    ) => {
                        callback(null, { getPublicKey: () => publicKey });
                    },
                } as any)
        );
        jwtMock.verify.mockImplementation(
            (token, cert, options, callback: any) => {
                callback(null, decodedPayload);
            }
        );

        const result = await authoriser.authorize(token);

        expect(result).toEqual(decodedPayload);
    });

    it('should throw an error when the decoded token is null', async () => {
        jwtMock.decode.mockReturnValue(null);

        await expect(authoriser.authorize(token)).rejects.toThrow('No key');
    });

    it('should throw an error when no key is returned', async () => {
        jwtMock.decode.mockReturnValue({ header: { kid } });
        jwksRsaMock.mockImplementation(
            () =>
                ({
                    getSigningKey: (
                        kid: string,
                        callback: (err: Error | null, key: any) => void
                    ) => {
                        callback(null, null);
                    },
                } as any)
        );

        await expect(authoriser.authorize(token)).rejects.toThrow('No key');
    });

    it('should throw an error when no decoded result is returned', async () => {
        jwtMock.decode.mockReturnValue({ header: { kid } });
        jwksRsaMock.mockImplementation(
            () =>
                ({
                    getSigningKey: (
                        kid: string,
                        callback: (err: Error | null, key: any) => void
                    ) => {
                        callback(null, { getPublicKey: () => publicKey });
                    },
                } as any)
        );
        jwtMock.verify.mockImplementation(
            (token, cert, options, callback: any) => {
                callback(null, undefined);
            }
        );

        await expect(authoriser.authorize(token)).rejects.toThrow(
            'No decode result'
        );
    });
});
