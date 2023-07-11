import {
    Delete,
    Update,
    UpdateItemCommand,
    UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { NativeAttributeValue, marshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb, sendWriteCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { IFolder, IFolderRecord } from '../type';
import { getFolder, getFolderAsync } from './getFolder';

export interface UpdateTransactionItem {
    Delete?: Omit<Delete, 'Key' | 'ExpressionAttributeValues'> & {
        Key: Record<string, NativeAttributeValue> | undefined;
        ExpressionAttributeValues?: Record<string, NativeAttributeValue>;
    };
    Update?: Omit<Update, 'Key' | 'ExpressionAttributeValues'> & {
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
): TE.TaskEither<Error, UpdateTransactionItem[]>;
export function updateFolder(
    id: string,
    changes: Partial<IFolderRecord>,
    org: string,
    transact?: boolean
): TE.TaskEither<Error, UpdateTransactionItem[] | void> {
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

            console.log(id, changes, org);

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
                ExpressionAttributeNames: attributeNames as any,
                ExpressionAttributeValues: marshall(attributeValues),
            };

            console.log(updateParams);

            const updateCommand = new UpdateItemCommand(updateParams);

            return transact
                ? TE.right([
                      <UpdateTransactionItem>{
                          Update: {
                              ...updateParams,
                              Key: {
                                  PK: `Folder#${parent}`,
                                  SK: `Folder#${result.id}`,
                              },
                              ExpressionAttributeNames: attributeNames,
                              ExpressionAttributeValues: attributeValues,
                          },
                      },
                  ])
                : pipe(
                      updateCommand,
                      sendWriteCommand,
                      TE.chain(() => TE.right(void 0))
                  );
        })
    );
}

export async function updateFolderAsync(
    id: string,
    changes: Partial<IFolderRecord>,
    org: string,
    transact?: undefined | false,
    folder?: IFolder
): Promise<void>;
export async function updateFolderAsync(
    id: string,
    changes: Partial<IFolderRecord>,
    org: string,
    transact: true,
    folder?: IFolder
): Promise<UpdateTransactionItem>;
export async function updateFolderAsync(
    id: string,
    changes: Partial<IFolderRecord>,
    org: string,
    transact?: boolean,
    folder?: IFolder
): Promise<UpdateTransactionItem | void> {
    const result = folder || (await getFolderAsync(id, org));

    const parent = result.parent;

    delete changes.PK;
    delete changes.SK;
    delete changes.createdAt;
    delete changes.org;
    delete changes.deletedAt;

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

    if (transact) {
        return <UpdateTransactionItem>{
            Update: {
                ...updateParams,
                Key: {
                    PK: `Folder#${parent}`,
                    SK: `Folder#${result.id}`,
                },
                ExpressionAttributeNames: attributeNames,
                ExpressionAttributeValues: attributeValues,
            },
        };
    }

    const updateCommand = new UpdateItemCommand(updateParams);

    await dynamoDb.send(updateCommand);
}
