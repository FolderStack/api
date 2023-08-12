import {
    DeleteItemCommand,
    PutItemCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { HttpInternalServerError } from '../../errors';
import { dynamoDb } from './dynamo';

export function sendWriteCommand(
    command: PutItemCommand | UpdateItemCommand | DeleteItemCommand
): TE.TaskEither<Error, void> {
    return pipe(
        TE.tryCatch(
            async () => {
                await dynamoDb.send(command as any);
            },
            (error) => {
                console.log(error);
                return error instanceof Error
                    ? error
                    : new HttpInternalServerError();
            }
        )
    );
}
