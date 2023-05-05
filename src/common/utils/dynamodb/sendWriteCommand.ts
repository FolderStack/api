import { PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { dynamoDb } from './dynamo';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { HttpInternalServerError } from '../../errors';

export function sendWriteCommand(command: PutItemCommand | UpdateItemCommand): TE.TaskEither<Error, void> {
    return pipe(
        TE.tryCatch(
            async () => {
                await dynamoDb.send(command as any)
            },
            error => error instanceof Error ? error : new HttpInternalServerError()
        )
    )
}