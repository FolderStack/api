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
        TableName: config.tables.table,
        Key,
    };

    const deleteParams: DeleteItemCommandInput = {
        TableName: config.tables.table,
        Key,
    };

    return pipe(
        TE.fromTask(async () => {
            const command = new GetItemCommand(getParams);
            const result = await dynamoDb.send(command);
            return result;
        }),
        TE.chain((result) => {
            const item = unmarshall(result.Item ?? {});

            if (Object.keys(item ?? {}).length === 0) {
                return TE.right(void 0);
            }

            if (item.org !== org) return TE.left(new HttpForbiddenError());

            return pipe(
                TE.tryCatch(
                    () => fromFileRecordToJson(item as IFileRecord),
                    (err) => err as Error
                ),
                TE.chain(file => {
                    const fileSize = file.fileSize ?? 0;
                    return pipe(
                        new DeleteItemCommand(deleteParams),
                        sendWriteCommand,
                        TE.chain(() => {
                            if (folder && folder !== 'ROOT') {
                                return updateFolderFileSize(folder, -fileSize, org);
                            }
                            return TE.right(void 0);
                        })
                    )
                }),
            );
        })
    );
}
