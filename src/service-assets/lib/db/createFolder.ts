import {
    PutItemCommand,
    PutItemCommandInput,
    QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
    cleanAndMarshall,
    logger,
    sendReadCommand,
    sendWriteCommand,
} from '@common/utils';
import { config } from '@config';
import { randomUUID } from 'crypto';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { fromFolderRecordToJson } from '../fromFolderRecordToJson';
import { IFolder, IFolderRecord } from '../type';
import { updateFolderFileSize } from './updateFolderFileSize';

export function createFolder(
    name: string,
    image: string | null,
    parent: string | null,
    org: string
): TE.TaskEither<Error, IFolder> {
    parent ??= 'ROOT';

    const id = randomUUID();
    const record: IFolderRecord = {
        PK: `Folder#${parent}`,
        SK: `Folder#${id}`,
        entityType: 'Folder',
        name,
        image,
        fileSize: 0,
        itemCount: 0,
        org,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        deletedAt: null,
    };

    const parentRecord = {
        PK: `Folder#${id}`,
        SK: `Parent#${parent ?? 'ROOT'}`,
        entityType: 'FolderParent',
        org,
    };

    const parentParams = {
        TableName: config.tables.table,
        Item: cleanAndMarshall(parentRecord),
    };

    logger.debug('createFolder Record:', record);

    const params: PutItemCommandInput = {
        TableName: config.tables.table,
        Item: cleanAndMarshall(record),
    };

    logger.debug('createFolder params:', params);

    const checkIfFolderExists: QueryCommandInput = {
        TableName: config.tables.table,
        KeyConditionExpression: 'PK = :parentId',
        FilterExpression: '#name = :name AND #entityType = :entityType',
        ExpressionAttributeValues: marshall({
            ':parentId': record.PK,
            ':name': record.name,
            ':entityType': 'Folder',
        }),
        ExpressionAttributeNames: {
            // name is reserved, need to use #name instead
            '#name': 'name',
            '#entityType': 'entityType',
        },
    };

    // Checks if the folder exists and returns the result as an Either.
    const folderExists = pipe(
        new QueryCommand(checkIfFolderExists),
        sendReadCommand,
        TE.map((result) => {
            logger.debug('folderExists', { result });
            return result.length > 0
                ? E.right(result[0] as IFolderRecord)
                : E.left(null);
        })
    );

    // Creates the folder and its parent, and updates the folder size if needed.
    const createFolderAndParent = () =>
        pipe(
            new PutItemCommand(parentParams),
            sendWriteCommand,
            TE.chain(() => pipe(new PutItemCommand(params), sendWriteCommand)),
            TE.chain(() =>
                parent && parent !== 'ROOT'
                    ? updateFolderFileSize(parent, 0, org)
                    : TE.right(null)
            ),
            TE.map(() => ({
                ...fromFolderRecordToJson(record),
                created: true,
            }))
        );

    // Check if folder exists, and based on result either
    // return the existing folder or create a new one.
    return pipe(
        folderExists,
        TE.chain((existingFolder) =>
            E.fold(createFolderAndParent, (folder) => {
                logger.debug('existingFolder', { folder });
                return TE.right(
                    fromFolderRecordToJson(folder as IFolderRecord)
                );
            })(existingFolder)
        ) // Directly invoke the fold function with existingFolder.
    );
}
