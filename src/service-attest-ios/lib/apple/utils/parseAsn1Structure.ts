import { AttestationRequest } from '../types';
import { toArrayBuffer } from './arrayBuffers';
import { convertBase64ToJSON } from './convertAttestationToJSON';

export function parseAsn1Structure(
    attestationObject: string
): AttestationRequest {
    const attestationObjectJson = convertBase64ToJSON(attestationObject);

    const appIdHash = toArrayBuffer(
        Buffer.from(attestationObjectJson.authData.data.slice(0, 32))
    );
    const counter = toArrayBuffer(
        Buffer.from(attestationObjectJson.authData.data.slice(33, 37))
    );

    const aaguid = toArrayBuffer(
        Buffer.from(attestationObjectJson.authData.data.slice(37, 53))
    );
    const credentialId = Buffer.from(
        attestationObjectJson.authData.data.slice(55, 87)
    );
    const publicKey = Buffer.from(attestationObjectJson.attStmt.x5c[0].data);
    const receipt = Buffer.from(attestationObjectJson.attStmt.receipt.data);

    return {
        appIdHash,
        counter,
        aaguid,
        credentialId,
        publicKey,
        receipt,
        attestation: attestationObjectJson,
    };
}

// 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
// 0 0 0 0
// 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
// 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
