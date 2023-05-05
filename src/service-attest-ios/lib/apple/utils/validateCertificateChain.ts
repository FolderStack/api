import * as Crypto from 'crypto';
import { getAttestCA } from '../assets/getAsset';

export function validateCertificateChain(
    certificates: [Crypto.X509Certificate, Crypto.X509Certificate]
): boolean {
    try {
        const [cred, ca] = certificates;

        const appleAttestCA = getAttestCA();
        const appleCert = new Crypto.X509Certificate(appleAttestCA);

        const caValid = ca.verify(appleCert.publicKey);
        const credValid = cred.verify(ca.publicKey);

        if (!caValid) {
            throw new Error('Intermedia certificate invalid.');
        }

        if (!credValid) {
            throw new Error('Leaf certificate invalid.');
        }

        return true;
    } catch (error: any) {
        console.error('Certificate chain validation failed:', error.message);
        return false;
    }
}
