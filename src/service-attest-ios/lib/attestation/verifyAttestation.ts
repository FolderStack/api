
import { AttestationRequest, ClientBundleIOS } from '@common/types';
import { logger } from '@common/utils';
import { extractCertificates, validateCertificateChain } from '../utils';
import { sendAttestationDataRequest } from './sendAttestationRequest';
import { validateNonce } from './validateNonce';
import { verifyAttestationPayload } from './verifyAttestationPayload';

export async function verifyAttestation(
    request: AttestationRequest,
    clientChallenge: string,
    localKeyId: string, // Represents the keyId of the Attestation keypair on the device...
    client: ClientBundleIOS
): Promise<string | undefined> {
    if (!verifyAttestationPayload(request, localKeyId, client)) {
        logger.debug('Failed to verify payload.');
        return;
    }

    const certificates = extractCertificates(request);
    const isValidCertificateChain = validateCertificateChain(certificates);
    if (!isValidCertificateChain) {
        logger.debug('Failed to validate certificate chain.');
        return;
    }

    const isValidNonce = validateNonce(request, clientChallenge);
    if (!isValidNonce) {
        logger.debug('Failed to verify nonce.');
        return;
    }

    const receipt = Buffer.from(request.receipt);
    const attestationResponse = await sendAttestationDataRequest(
        receipt.toString('base64'),
        client
    );

    if (typeof attestationResponse !== 'string') return;

    return attestationResponse;
}
