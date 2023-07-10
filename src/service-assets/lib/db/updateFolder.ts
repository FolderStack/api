import {
    Update,
    UpdateItemCommand,
    UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { NativeAttributeValue, marshall } from '@aws-sdk/util-dynamodb';
import { sendWriteCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { IFolderRecord } from '../type';
import { getFolder } from './getFolder';

interface UpdateTransactionItem {
    Update: Omit<Update, 'Key' | 'ExpressionAttributeValues'> & {
        Key: Record<string, NativeAttributeValue> | undefined;
        ExpressionAttributeValues?: Record<string, NativeAttributeValue>;
    };
}

export function updateFolder(
    id: string,
    changes: Partial<IFolderRecord>,
    org: string,
    transact?: undefined | false
): TE.TaskEither<Error, void>;
export function updateFolder(
    id: string,
    changes: Partial<IFolderRecord>,
    org: string,
    transact: true
): TE.TaskEither<Error, UpdateTransactionItem>;
export function updateFolder(
    id: string,
    changes: Partial<IFolderRecord>,
    org: string,
    transact?: boolean
): TE.TaskEither<Error, UpdateTransactionItem | void> {
    return pipe(
        getFolder(id, org),
        TE.chain((result) => {
            const parent = result.parent;

            delete changes.PK;
            delete changes.SK;
            delete changes.createdAt;
            delete changes.org;
            delete changes.deletedAt;

            changes.updatedAt = new Date().getTime();

            const updateExpressions = [];
            const attributeNames: Record<string, unknown> = {};
            const attributeValues: Record<string, unknown> = {};

            for (const [key, value] of Object.entries(changes)) {
                updateExpressions.push(`#${key} = :${key}`);
                attributeNames[`#${key}`] = key;
                attributeValues[`:${key}`] = value;
            }

            const updateParams: UpdateItemCommandInput = {
                TableName: config.tables.assetTable,
                Key: marshall({
                    PK: `Folder#${parent}`,
                    SK: `Folder#${result.id}`,
                }),
                UpdateExpression: 'SET ' + updateExpressions.join(', '),
                ExpressionAttributeNames: marshall(attributeNames) as any,
                ExpressionAttributeValues: marshall(attributeValues),
            };

            const updateCommand = new UpdateItemCommand(updateParams);

            return transact
                ? TE.right(<UpdateTransactionItem>{
                      Update: {
                          ...updateParams,
                          Key: {
                              PK: `Folder#${parent}`,
                              SK: `Folder#${result.id}`,
                          },
                          ExpressionAttributeNames: attributeNames,
                          ExpressionAttributeValues: attributeValues,
                      },
                  })
                : pipe(
                      updateCommand,
                      sendWriteCommand,
                      TE.chain(() => TE.right(void 0))
                  );
        })
    );
}
