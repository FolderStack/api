import * as asn1 from 'asn1js';
import * as pkijs from 'pkijs';
import { AttestationResponse } from '../types';

export function parseAttestationResponse(
    attestationResponse: string
): AttestationResponse {
    const content = pkijs.ContentInfo.fromBER(
        Buffer.from(attestationResponse, 'base64')
    );

    const signed = new pkijs.SignedData({
        schema: content.content,
    });

    const [b1, b2] = signed.encapContentInfo.eContent!.valueBlock.value as any;

    const hex = Buffer.concat([
        b1.valueBlock.valueHexView,
        b2.valueBlock.valueHexView,
    ]);

    const data = asn1.fromBER(hex).result as asn1.Constructed;

    const strings: string[] = [];
    const octetStrings: Uint8Array[] = [];

    for (const block of data.valueBlock.value) {
        const buffer = Buffer.from(block.valueBeforeDecodeView);
        let val: string | Uint8Array | undefined;
        let paddingCount = 0;

        if ((block as any).valueBlock?.value instanceof Array) {
            for (const innerBlock of (block as any).valueBlock.value) {
                if (innerBlock.blockName === 'INTEGER') {
                    paddingCount += innerBlock.blockLength;
                } else {
                    // For ID and Length parts
                    paddingCount += 2;
                }
                if (innerBlock.valueBlock.valueHexView) {
                    const length = innerBlock.lenBlock?.length;
                    const hex = innerBlock.valueBlock.valueHexView;
                    if (typeof length === 'number' && hex.length === length) {
                        val = Buffer.from(hex, 'hex');
                    }
                }
            }
        }

        if (!val) {
            const raw = buffer.subarray(paddingCount);
            if ((block as any).tagClass === 4) {
                val = raw;
                octetStrings.push(val);
            } else {
                val = Buffer.from(raw).toString('ascii');
            }
        }

        strings.push(val as any);
    }

    const [attestCertBuffer, rootCACertBuffer] = octetStrings;

    const values = {
        integer: Number(strings[0]),
        receiptType: Buffer.from(strings[1]).toString('ascii') as any,
        appId: Buffer.from(strings[2]).toString('ascii'),
        publicKey: Buffer.from(strings[3], 'ascii'),
        clientHash: Buffer.from(strings[4], 'ascii'),
        token: Buffer.from(strings[5], 'ascii'),
        riskMetric: Number.isNaN(Number(strings[6])) ? -1 : Number(strings[6]),
        created: new Date(strings[7]),
        notBefore: new Date(strings[8]),
        expires: new Date(strings[9]),
        attestCertBuffer,
        rootCACertBuffer,
    };

    return {
        values,
        signed,
    };
}
