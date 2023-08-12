import { Archiver } from 'archiver';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { appendToArchive } from '../appendToArchive';
import { getContentsOfFolderDeep } from '../db/getContentsOfFolderDeep';
import { IFile, IFolder } from '../type';

export function archiveFolder(
    folder: string,
    orgId: string,
    archive: Archiver
) {
    function addToArchive(path: string) {
        return function _(item: IFolder | IFile): TE.TaskEither<Error, void> {
            if (item.type === 'file') {
                return pipe(appendToArchive(item, path, archive));
            }
            return pipe(
                getContentsOfFolderDeep(item.id, orgId),
                TE.chain((contents) =>
                    pipe(
                        TE.sequenceArray(
                            contents.map(addToArchive(`${path}${item.name}/`))
                        ),
                        TE.map(() => undefined)
                    )
                )
            );
        };
    }

    return pipe(
        getContentsOfFolderDeep(folder, orgId),
        TE.map((contents) => contents.map(addToArchive('/')))
    );
}
