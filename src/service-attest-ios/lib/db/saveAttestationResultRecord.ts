import { PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { AttestationRequest, AttestationResponse, ClientBundleIOS } from '@common/types';
import { sendWriteCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { createAttestationReceiptRecord } from './createAttestationReceiptRecord';

interface StoreAttestationParameters {
    device: string;
    keyId: string;
    challenge: string;
    request: AttestationRequest;
    response: AttestationResponse;
    client: ClientBundleIOS;
}

export function saveAttestationResult(
    params: StoreAttestationParameters
): TE.TaskEither<Error, void> {
    const receiptId = Buffer.from(params.request.receipt).toString('hex');
    const receipt = createAttestationReceiptRecord(
        params.client.bundleId,
        params.device,
        receiptId,
        params.response.values
    );

    const command: PutItemCommandInput = {
        TableName: config.tables.integrityTable,
        Item: marshall(receipt),
    };

    return pipe(
        new PutItemCommand(command),
        sendWriteCommand
    );
}
