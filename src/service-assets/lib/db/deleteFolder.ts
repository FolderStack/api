import {
    DeleteItemCommand,
    DeleteItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { sendWriteCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { getFolder } from './getFolder';
import { updateFolderFileSize } from './updateFolderFileSize';

export function deleteFolder(
    id: string,
    org: string
): TE.TaskEither<Error, void> {
    return pipe(
        getFolder(id, org),
        // For now, folders are soft deleted...
        // TE.chain((result) => {
        //     return pipe(
        //         TE.fromTask(async () => {
        //             const items = getContentsOfFolder({ folderId: id, orgId: org });
        //         }),
        //         TE.right(result)
        //     );
        // }),
        TE.chain((result) => {
            console.log({ result });
            const parent = result.parent;
            const fileSize = result.fileSize ?? 0;

            const deleteParams: DeleteItemCommandInput = {
                TableName: config.tables.assetTable,
                Key: marshall({
                    PK: `Folder#${parent}`,
                    SK: `Folder#${result.id}`,
                }),
            };

            return pipe(
                new DeleteItemCommand(deleteParams),
                sendWriteCommand,
                TE.chain(() => {
                    if (parent && parent !== 'ROOT') {
                        return updateFolderFileSize(parent, -fileSize, org);
                    }
                    return TE.right(void 0);
                })
            );
        })
    );
}
