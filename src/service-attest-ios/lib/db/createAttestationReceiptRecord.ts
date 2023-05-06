import { createHash } from "crypto";
import { normaliseDate } from "../../../common/db/normaliseDate";
import { AttestationResponse, IAttestationReceipt } from "../type";

export function createAttestationReceiptRecord(
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