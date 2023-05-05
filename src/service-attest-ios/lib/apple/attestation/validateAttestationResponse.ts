import * as crypto from 'crypto';
import { logger } from '../../../../common';
import { BundleId, TeamId } from '../../../constants';
import { getAppleRootCA } from '../assets/getAsset';
import { AttestationRequest, AttestationResponse } from '../types';

// https://developer.apple.com/documentation/devicecheck/assessing_fraud_risk#overview
export async function validateAttestationResponse(
    response: AttestationResponse,
    request: AttestationRequest
) {
    try {
        // 1. Verify the signature
        // ???????

        // 2. Verify the certificate chain
        const certs = response.signed
            .certificates!.map((cert) => cert.toString('base64'))
            .map(
                (cert) =>
                    `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`
            );

        const signingCert = new crypto.X509Certificate(certs[0]);
        const intermediateCert = new crypto.X509Certificate(certs[1]);
        const rootCert = new crypto.X509Certificate(certs[2]);

        let isChainValid = false;
        isChainValid = signingCert.verify(intermediateCert.publicKey);
        isChainValid = intermediateCert.verify(rootCert.publicKey);

        // Make sure we have matching root certificate pems...
        isChainValid =
            certs[2].replace(/\n/g, '') ===
            getAppleRootCA().toString('utf-8').replace(/\n/g, '');

        if (!isChainValid) {
            throw new Error('Failed verify signing certificate.');
        }

        // Skip #3, we have already parsed the structure...

        // 4. Verify that the app id matches
        if (response.values.appId !== `${TeamId}.${BundleId}`) {
            throw new Error('App Ids do not match.');
        }

        // 5. Verify that the creation time isn't more than 5 minutes ago
        const now = Date.now();
        const created = response.values.created.getTime();
        const fiveMins = 1000 * 60 * 5;

        if (now - created > fiveMins) {
            throw new Error('Verification window has elapsed.');
        }

        // 6. Verify that the public key matches the original attestation one.
        if (!request.publicKey.equals(response.values.publicKey)) {
            throw new Error('Public keys do not match.');
        }
    } catch (err) {
        console.log(err);
        logger.warn(err);
        throw new Error('Attestation response validation failed.');
    }
}
