import { PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import {
    AttestationRequest,
    AttestationResponse,
    createAttestationReceipt,
    sendWriteCommand,
} from '../../../../common';
import { config } from '../../../../config';

interface StoreAttestationParameters {
    device: string;
    keyId: string;
    challenge: string;
    request: AttestationRequest;
    response: AttestationResponse;
}

export function storeAttestationResult(
    params: TE.TaskEither<Error, StoreAttestationParameters>
): TE.TaskEither<Error, void> {
    return pipe(
        params,
        TE.map((data) => {
            const receiptId = Buffer.from(data.request.receipt).toString('hex');
            const receipt = createAttestationReceipt(
                data.device,
                receiptId,
                data.response.values
            );

            const input: PutItemCommandInput = {
                TableName: config.tables.integrityTable,
                Item: marshall(receipt),
            };
            return new PutItemCommand(input);
        }),
        TE.chain((data) => sendWriteCommand(data))
    );
}
