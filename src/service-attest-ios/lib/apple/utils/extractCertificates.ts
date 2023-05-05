import * as Crypto from 'crypto';
import { AttestationRequest } from '../types';

export function extractCertificates(
    request: AttestationRequest
): [Crypto.X509Certificate, Crypto.X509Certificate] {
    const attStmt = request.attestation.attStmt;
    const x5c = attStmt.x5c;

    if (!x5c || !Array.isArray(x5c)) {
        throw new Error('No x5c certificates found in the attestation object');
    }

    const certificates = x5c.map((cert) => {
        const certBase64 = Buffer.from(cert.data).toString('base64');
        const certPem = `-----BEGIN CERTIFICATE-----\n${certBase64}\n-----END CERTIFICATE-----`;
        return new Crypto.X509Certificate(certPem);
    });

    return certificates as any;
}
