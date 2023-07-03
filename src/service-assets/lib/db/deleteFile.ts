import {
    DeleteItemCommand,
    DeleteItemCommandInput,
    GetItemCommand,
    GetItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { HttpForbiddenError } from '@common/errors';
import { dynamoDb, sendWriteCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { fromFileRecordToJson } from '../fromFileRecordToJson';
import { IFileRecord } from '../type';
import { updateFolderFileSize } from './updateFolderFileSize';

export function deleteFile(
    id: string,
    folder: string,
    org: string
): TE.TaskEither<Error, void> {
    const Key = marshall({
        PK: `Folder#${folder}`,
        SK: `File#${id}`,
    });

    const getParams: GetItemCommandInput = {
        TableName: config.tables.assetTable,
        Key,
    };

    const deleteParams: DeleteItemCommandInput = {
        TableName: config.tables.assetTable,
        Key,
    };

    return pipe(
        TE.fromTask(async () => {
            const command = new GetItemCommand(getParams);
            const result = await dynamoDb.send(command);
            console.log({ result });
            return result;
        }),
        TE.chain((result) => {
            const item = unmarshall(result.Item ?? {});
            console.log({ item });
            if (item.org !== org)
                return TE.throwError(new HttpForbiddenError());

            const file = fromFileRecordToJson(item as IFileRecord);
            const fileSize = file.fileSize ?? 0;

            return pipe(
                new DeleteItemCommand(deleteParams),
                sendWriteCommand,
                TE.chain(() => updateFolderFileSize(folder, -fileSize, org))
            );
        })
    );
}
