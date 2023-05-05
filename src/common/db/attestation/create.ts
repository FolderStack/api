import { createHash } from 'crypto';
import { normaliseDate } from '../normaliseDate';
import {
    AttestationRequest,
    AttestationResponse,
    IAttestation,
    IAttestationChallenge,
    IAttestationReceipt,
} from './type';

export function createAttestationChallenge(
    device: `Device#${string}`,
    challenge: string,
    state: string
): IAttestationChallenge {
    return {
        PK: device,
        SK: `Challenge#${challenge}`,
        entityType: 'Challenge',
        state,
        createdAt: Date.now(),
        updatedAt: null,
        deletedAt: null,
    };
}

export function createAttestation(
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

export function createAttestationReceipt(
    device: string,
    receipt: string,
    receiptInfo: AttestationResponse['values']
): IAttestationReceipt {
    const now = Date.now();
    const receiptHash = createHash('md5').update(receipt).digest('hex');

    const result: IAttestationReceipt = {
        PK: `Device#${device}`,
        SK: `Receipt#${receiptHash}#${normaliseDate(now)}`,
        entityType: 'AttestationReceipt',

        receiptType: receiptInfo.receiptType,
        appId: receiptInfo.appId,
        publicKey: receiptInfo.publicKey,
        clientHash: receiptInfo.clientHash,
        token: receiptInfo.token,
        riskMetric: receiptInfo.riskMetric,
        created: receiptInfo.created.getTime(),
        notBefore: receiptInfo.notBefore.getTime(),
        expires: receiptInfo.expires.getTime(),

        createdAt: now,
        updatedAt: null,
        deletedAt: null,
    };

    return result;
}
