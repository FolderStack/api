import { PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { cleanAndMarshall, logger, sendWriteCommand } from '@common/utils';
import { config } from '@config';
import { randomUUID } from 'crypto';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { fromFolderRecordToJson } from '../fromFolderRecordToJson';
import { IFolder, IFolderRecord } from '../type';

export function createFolder(
    name: string,
    image: string | null,
    parent: string | null,
    org: string
): TE.TaskEither<Error, IFolder> {
    const id = randomUUID();
    const record: IFolderRecord = {
        PK: `Folder#${parent ?? 'ROOT'}`,
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
        TableName: config.tables.assetTable,
        Item: cleanAndMarshall(parentRecord),
    };

    logger.debug('createFolder Record:', record);

    const params: PutItemCommandInput = {
        TableName: config.tables.assetTable,
        Item: cleanAndMarshall(record),
    };

    logger.debug('createFolder params:', params);

    return pipe(
        new PutItemCommand(parentParams),
        sendWriteCommand,
        TE.chain(() => {
            return pipe(new PutItemCommand(params), sendWriteCommand);
        }),
        // TE.chain(() => {
        //     if (parent && parent !== 'ROOT') {
        //         // return pipe(updateFolderFileSize(parent, 0, org));
        //     } else {
        //         return TE.right(null);
        //     }
        // }),
        TE.map(() => fromFolderRecordToJson(record))
    );
}
