import { HttpBadRequestError } from '@common/errors';
import { Ok } from '@common/responses';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as TE from 'fp-ts/TaskEither';
import { attestationFlow } from '../lib/attestation';
import { getClientByBundleId, getClientDataByChallenge } from '../lib/db';
import { tracedHandler as handler } from './attestDevice'; // Update this import path

jest.mock('../lib/attestation');
jest.mock('../lib/db');

describe('Handler tests', () => {
    let mockEvent: APIGatewayProxyEvent;

    beforeEach(() => {
        mockEvent = {
            body: JSON.stringify({
                attestation: 'mockAttestation',
                challenge: 'mockChallenge',
                device: 'mockDevice',
                keyId: 'mockKeyId',
                bundleId: 'mockBundleId',
            }),
            // Fill other properties according to your needs
        } as unknown as APIGatewayProxyEvent;

        (getClientDataByChallenge as jest.Mock).mockReturnValue(TE.right(undefined));
        (getClientByBundleId as jest.Mock).mockReturnValue(TE.right('client'));
        (attestationFlow as jest.Mock).mockReturnValue(TE.right('attestationResult'));
    });

    it('should return a bad request error if required fields are missing', async () => {
        mockEvent.body = JSON.stringify({}); // Empty body

        const result = await handler(mockEvent, {} as Context);

        expect(result).toBeInstanceOf(HttpBadRequestError);
    });

    it('should call getClientDataByChallenge and getClientByBundleId with the correct parameters', async () => {
        await handler(mockEvent, {} as Context);

        expect(getClientDataByChallenge).toHaveBeenCalledWith('mockChallenge', 'mockDevice');
        expect(getClientByBundleId).toHaveBeenCalledWith('mockBundleId');
    });

    it('should call attestationFlow with the correct parameters', async () => {
        await handler(mockEvent, {} as Context);

        expect(attestationFlow).toHaveBeenCalledWith(
            'mockAttestation',
            'mockChallenge',
            'mockDevice',
            'mockKeyId',
            'client'
        );
    });

    it('should return the correct result', async () => {
        const result = await handler(mockEvent, {} as Context);

        expect(result).toEqual({ status: Ok, data: 'attestationResult' });
    });
});
