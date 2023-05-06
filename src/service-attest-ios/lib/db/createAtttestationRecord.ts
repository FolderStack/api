import { AttestationRequest, IAttestation } from "../type";

export function createAttestationRecord(
    device: string,
    keyId: string,
    appId: string,
    attestationInfo: AttestationRequest
): IAttestation {
    return {
        PK: `Device#${device}`,
        SK: `KeyID#${keyId}`,
        entityType: 'Attestation',

        appId,
        appIdHash: Buffer.from(attestationInfo.appIdHash),
        aaguid: Buffer.from(attestationInfo.aaguid),
        counter: Buffer.from(attestationInfo.counter),
        credentialId: attestationInfo.credentialId,
        publicKey: attestationInfo.publicKey,
        receipt: attestationInfo.receipt,

        createdAt: Date.now(),
        updatedAt: null,
        deletedAt: null,
    };
}