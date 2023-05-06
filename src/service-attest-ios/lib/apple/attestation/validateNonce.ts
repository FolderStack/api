import * as x509 from '@peculiar/x509';
import { createHash } from 'crypto';
import * as forge from 'node-forge';
import { AttestationRequest } from '../../type';
import { extractCertificates, getOctetStringValue } from '../utils';

export function validateNonce(request: AttestationRequest, clientData: string) {
    const authData = request.attestation.authData.data;

    const certificates = extractCertificates(request);

    const clientDataHash = createHash('sha256').update(clientData).digest();

    const dataToHashBuffer = Buffer.concat([
        Buffer.from(authData),
        clientDataHash,
    ]);

    const encodedDataToHash = forge.util.binary.raw.encode(dataToHashBuffer);

    const nonceHash = forge.md.sha256.create();
    nonceHash.update(encodedDataToHash);
    const nonce = Buffer.from(nonceHash.digest().getBytes());

    const credCert = certificates[0];
    const x509Cert = new x509.X509Certificate(credCert.toString());

    const ext = x509Cert.extensions.find(
        (ex) => ex.type === '1.2.840.113635.100.8.2'
    );
    if (!ext) return false;

    const der = forge.asn1.fromDer(new forge.util.ByteStringBuffer(ext.value));
    const octetString = getOctetStringValue(der);

    if (octetString === null) return false;

    return nonce.toString('hex') === octetString.toString('hex');
}
