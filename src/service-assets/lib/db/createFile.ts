import { PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { cleanAndMarshall, sendWriteCommand } from '@common/utils';
import { config } from '@config';
import { randomUUID } from 'crypto';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { fromFileRecordToJson } from '../fromFileRecordToJson';
import { IFile, IFileRecord } from '../type';
import { updateFolderFileSize } from './updateFolderFileSize';

export function createFile(
    name: string,
    file: string,
    fileSize: number,
    fileType: string,
    folder: string,
    org: string
): TE.TaskEither<Error, IFile> {
    const id = randomUUID();
    const record: IFileRecord = {
        PK: `Folder#${folder}`,
        SK: `File#${id}`,
        entityType: 'File',
        name,
        asset: file,
        fileSize,
        fileType,
        org,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        deletedAt: null,
    };

    const params: PutItemCommandInput = {
        TableName: config.tables.assetTable,
        Item: cleanAndMarshall(record),
    };

    return pipe(
        new PutItemCommand(params),
        sendWriteCommand,
        () => updateFolderFileSize(folder, fileSize, org),
        TE.map(() => fromFileRecordToJson(record))
    );
}
