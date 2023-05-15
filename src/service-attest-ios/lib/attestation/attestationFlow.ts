import { HttpInternalServerError, HttpNotFoundError } from "@common/errors";
import { ClientBundleIOS } from "@common/types";
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { saveAttestationResult } from "../db";
import { parseAsn1Structure, parseAttestationResponse } from "../utils";
import { validateAttestationResponse } from './validateAttestationResponse';
import { verifyAttestation } from "./verifyAttestation";

export function attestationFlow(
    attestation: any,
    challenge: string,
    device: string,
    localkeyId: string, // Represents the keyId of the Attestation keypair on the device...
    client: ClientBundleIOS,
) {
    return pipe(
        TE.tryCatch(
            async () => {
                const request = parseAsn1Structure(attestation);
                const result = await verifyAttestation(
                    request,
                    challenge,
                    localkeyId,
                    client
                );

                if (!result) {
                    throw new HttpNotFoundError();
                }

                const response = parseAttestationResponse(result);
                await validateAttestationResponse(
                    response,
                    request,
                    client
                );

                // Use token in subsequent requests...
                return {
                    request,
                    response,
                    device,
                    client,
                    challenge,
                    keyId: localkeyId
                };
            }, 
            (error) =>
                error instanceof Error
                    ? error
                    : new HttpInternalServerError()
        ),
        TE.map(saveAttestationResult)
    )
}