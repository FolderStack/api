import { sendBatchWriteCommand } from '@common/utils';
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
            if (Array.isArray(result)) return TE.right(void 0);
            const parent = result.parent;
            const fileSize = result.fileSize ?? 0;

            const deleteFolderParams = {
                TableName: config.tables.table,
                Key: {
                    PK: `Folder#${parent}`,
                    SK: `Folder#${result.id}`,
                },
            };

            const deleteFolderParentParams = {
                TableName: config.tables.table,
                Key: {
                    PK: `Folder#${result.id}`,
                    SK: `Parent#${parent}`,
                },
            };

            return pipe(
                [
                    { Delete: deleteFolderParams },
                    { Delete: deleteFolderParentParams },
                ],
                sendBatchWriteCommand,
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
