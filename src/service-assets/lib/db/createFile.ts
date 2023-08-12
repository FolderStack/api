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
    const extractKeyFromS3Url = (url: string) => {
        const fileKey = url.split('?')[0].split('amazonaws.com/')[1];
        const s3Bucket = url.split('://')[1].split('.s3')[0];
        return `s3://${s3Bucket}/${fileKey}`;
    };

    const id = randomUUID();
    const record: IFileRecord = {
        PK: `Folder#${folder}`,
        SK: `File#${id}`,
        entityType: 'File',
        name,
        asset: extractKeyFromS3Url(file),
        fileSize,
        fileType,
        org,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        deletedAt: null,
    };

    const params: PutItemCommandInput = {
        TableName: config.tables.table,
        Item: cleanAndMarshall(record),
    };

    return pipe(
        new PutItemCommand(params),
        sendWriteCommand,
        TE.chain(() => updateFolderFileSize(folder, fileSize, org)),
        TE.map(() => fromFileRecordToJson(record))
    );
}
