import { sendBatchWriteCommand } from '@common/utils';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { getSubFolders } from './db/getSubFolders';
import { updateFolder } from './db/updateFolder';
import { IFolder } from './type';

export function updateTreeOrder(
    items: string[],
    org: string
): TE.TaskEither<Error, void> {
    return pipe(
        getSubFolders('ROOT', org),
        TE.map((folders) => {
            const sortedFolders = items
                .map((itemId) => folders.find((folder) => folder.id === itemId))
                .filter((folder) => folder !== undefined);

            return sortedFolders as IFolder[];
        }),
        TE.chain((folders) => {
            const updateCommands = folders.map((f, idx) =>
                updateFolder(f.id, { order: idx }, org, true)
            );
            return TE.sequenceArray(updateCommands);
        }),
        TE.chain((commands) => {
            return sendBatchWriteCommand([...commands]);
        })
    );
}
