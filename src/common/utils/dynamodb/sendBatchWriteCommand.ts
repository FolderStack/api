import {
    TransactWriteCommand,
    TransactWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { HttpInternalServerError } from '../../errors';
import { dynamoDb } from './dynamo';

export function sendBatchWriteCommand(
    items: TransactWriteCommandInput['TransactItems']
): TE.TaskEither<Error, void> {
    const batch = new TransactWriteCommand({
        TransactItems: items,
    });

    return pipe(
        TE.tryCatch(
            async () => {
                const result = await dynamoDb.send(batch as any);
                console.log(result);
            },
            (error) =>
                error instanceof Error ? error : new HttpInternalServerError()
        )
    );
}
