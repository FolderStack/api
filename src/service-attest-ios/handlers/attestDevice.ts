import { APIGatewayProxyEvent } from 'aws-lambda';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { Ok, logger, response, withSentryTrace } from '../../common';
import {
    HttpBadRequestError,
    HttpInternalServerError,
    HttpNotFoundError,
} from '../../common/errors';
import { verifyAttestation } from '../lib/apple';
import { getClientDataByChallenge } from '../lib/apple/attestation';
import { storeAttestationResult } from '../lib/apple/attestation/storeAttestationResult';
import { validateAttestationResponse } from '../lib/apple/attestation/validateAttestationResponse';
import {
    parseAsn1Structure,
    parseAttestationResponse,
} from '../lib/apple/utils';

async function handler(event: APIGatewayProxyEvent) {
    try {
        const body = JSON.parse(event.body ?? '{}');

        const attestation = body.attestation;
        const challenge = body.challenge;
        const device = body.device;
        const keyId = body.keyId;

        if (!keyId || !device || !challenge || !attestation) {
            return new HttpBadRequestError().toResponse();
        }

        return pipe(
            getClientDataByChallenge(challenge, device),
            TE.chain(() => {
                return pipe(
                    TE.tryCatch(
                        async () => {
                            const request = parseAsn1Structure(attestation);
                            const result = await verifyAttestation(
                                request,
                                challenge,
                                keyId
                            );

                            if (result) {
                                const response = parseAttestationResponse(
                                    result as any
                                );
                                try {
                                    await validateAttestationResponse(
                                        response,
                                        request
                                    );

                                    // Use token in subsequent requests...
                                    return {
                                        request,
                                        response,
                                        device,
                                        keyId,
                                        challenge,
                                    };
                                } catch (err) {
                                    logger.warn(err);
                                    throw new HttpInternalServerError();
                                }
                            }
                            throw new HttpNotFoundError();
                        },
                        (error) =>
                            error instanceof Error
                                ? error
                                : new HttpInternalServerError()
                    ),
                    storeAttestationResult
                );
            }),
            response(Ok)
        )();
    } catch (err) {
        //
    }
}

export const tracedHandler = withSentryTrace(handler);
