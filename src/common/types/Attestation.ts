import * as pkijs from 'pkijs';
import { BufferObject } from './BufferObject';
import { HasDates } from "./HasDates";
import { TableProperties } from "./TableProperties";

export interface AttestationObject {
    fmt: string;
    attStmt: {
        x5c: [BufferObject, BufferObject];
        receipt: BufferObject;
    };
    authData: BufferObject;
    clientDataHash?: BufferObject;
}

export interface AttestationRequest {
    appIdHash: ArrayBuffer;
    counter: ArrayBuffer;
    aaguid: ArrayBuffer;
    credentialId: Buffer;
    publicKey: Buffer;
    receipt: Buffer;

    attestation: AttestationObject;
}

export interface AttestationResponse {
    values: {
        integer: number;
        receiptType: 'RECEIPT' | 'ATTEST';
        appId: string;
        publicKey: Buffer;
        clientHash: Buffer;
        token: Buffer;
        riskMetric: number;
        created: Date;
        notBefore: Date;
        expires: Date;
    };
    signed: pkijs.SignedData;
}

export interface IAttestationChallenge extends TableProperties, HasDates {
    PK: `Device#${string}`;
    SK: `Challenge${string}`;
    entityType: 'Challenge';

    state: string;
}

export interface IAttestation extends TableProperties, HasDates {
    PK: `Device#${string}`;
    SK: `KeyID#${string}`;
    entityType: 'Attestation';

    appId: string;
    appIdHash: Buffer;

    counter: Buffer;
    aaguid: Buffer;
    credentialId: Buffer;
    publicKey: Buffer;
    receipt: Buffer;
}

export interface IAttestationReceipt extends TableProperties, HasDates {
    PK: `Device#${string}`;
    SK: `Receipt#${string}#${string}`;
    entityType: 'AttestationReceipt';

    bundleId: string;
    
    appId: string;
    riskMetric: number;
    clientHash: Buffer;
    receiptType: 'RECEIPT' | 'ATTEST';
    publicKey: Buffer;
    token: Buffer;
    created: number;
    notBefore: number;
    expires: number;
}
