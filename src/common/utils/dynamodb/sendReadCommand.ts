import { QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { QueryCommandOutput, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { HttpInternalServerError } from '../../errors';
import { dynamoDb } from './dynamo';
import { processOutputItems } from './processOutputItems';

type DynamoCommand = QueryCommand | ScanCommand;
type DynamoCommandOutput = QueryCommandOutput | ScanCommandOutput;

export const sendReadCommand = <T>(
    command: DynamoCommand,
    paginate = false
): TE.TaskEither<Error, T[]> =>
    pipe(
        fetchItemsRecursively(command, paginate),
        TE.chain((output) => TE.fromEither(processOutputItems<T>(output)))
    );

const fetchItemsRecursively = (
    command: DynamoCommand,
    paginate = false
): TE.TaskEither<Error, DynamoCommandOutput> =>
    pipe(
        TE.tryCatch(
            () => dynamoDb.send(command),
            (error) =>
                error instanceof Error ? error : new HttpInternalServerError()
        ),
        TE.chain((response) => {
            if (!paginate || !response.LastEvaluatedKey) {
                return TE.right(response);
            }

            const nextCommand =
                command instanceof QueryCommand
                    ? new QueryCommand({
                          ...command.input,
                          ExclusiveStartKey: response.LastEvaluatedKey,
                      })
                    : new ScanCommand({
                          ...command.input,
                          ExclusiveStartKey: response.LastEvaluatedKey,
                      });

            return pipe(
                fetchItemsRecursively(nextCommand),
                TE.map((nextResponse) => {
                    const count =
                        (response.Count ?? 0) + (nextResponse.Count ?? 0);
                    const scannedCount =
                        (response.ScannedCount ?? 0) +
                        (nextResponse.ScannedCount ?? 0);
                    return {
                        ...response,
                        Items: response.Items?.concat(nextResponse.Items ?? []),
                        Count: count,
                        ScannedCount: scannedCount,
                        LastEvaluatedKey: nextResponse.LastEvaluatedKey,
                    };
                })
            );
        })
    );
