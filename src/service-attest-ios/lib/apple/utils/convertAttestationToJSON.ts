import { Buffer } from 'buffer';
import * as cbor from 'cbor';
import { AttestationObject } from '../../type';

function base64ToArrayBuffer(base64: string) {
    const buffer = Buffer.from(base64, 'base64');
    return Uint8Array.from(buffer).buffer;
}

function arrayBufferToJSON(arrayBuffer: ArrayBuffer) {
    const decodedCbor = cbor.decode(arrayBuffer);
    return JSON.parse(JSON.stringify(decodedCbor));
}

export function convertBase64ToJSON(obj: string): AttestationObject {
    return arrayBufferToJSON(base64ToArrayBuffer(obj));
}
