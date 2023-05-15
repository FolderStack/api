import { ClientBundleIOS } from '@common/types';
import { createHash } from 'crypto';
import { arrayBufferEquals } from '../utils';

export function verifyAttestationPayload(
    asn1Payload: any,
    localKeyId: string, // Represents the keyId of the Attestation keypair on the device...
    client: ClientBundleIOS,
    storedPublicKey?: string
): boolean {
    const appIdSignature = Buffer.from(asn1Payload.appIdHash).toString('hex');
    const publicKey = Buffer.from(asn1Payload.publicKey).toString('hex');

    const appIdHash = createHash('sha256')
        .update(`${client.teamId}.${client.bundleId}`)
        .digest()
        .toString('hex');

    if (appIdSignature !== appIdHash) {
        console.error(
            'App ID hash does not match RP ID hash in the attestation object'
        );
        return false;
    }

    // Verify the counter field equals 0
    const counterDataView = new DataView(asn1Payload.counter);
    const counter = counterDataView.getUint32(0, false); // false means big-endian byte order
    if (counter !== 0) {
        console.error('Counter is not 0');
        return false;
    }

    const aaguid = asn1Payload.aaguid; // 13 is the starting index of the AAGUID in authData

    const aaguidDevelop = Buffer.from('appattestdevelop', 'utf8');
    const aaguidProduction = Buffer.from(
        'appattest' + '\x00'.repeat(7),
        'utf8'
    );

    if (
        !arrayBufferEquals(aaguid, aaguidDevelop) &&
        !arrayBufferEquals(aaguid, aaguidProduction)
    ) {
        console.error('AAGUID value is incorrect');
        return false;
    }

    if (!Buffer.from(localKeyId, 'base64').equals(asn1Payload.credentialId)) {
        console.error(
            'Credential ID in the attestation object does not match the key identifier'
        );
        return false;
    }

    if (storedPublicKey) {
        if (publicKey !== storedPublicKey) {
            console.error('Public key does not match the stored value.');
            return false;
        }
    }

    return true;
}
