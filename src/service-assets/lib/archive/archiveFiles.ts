import { Archiver } from 'archiver';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { appendToArchive } from '../appendToArchive';
import { getFilesByIdList } from '../db/getFilesByIdList';

export function archiveFiles(
    archive: Archiver,
    path: string,
    fileIds: string[],
    orgId: string
) {
    return pipe(
        getFilesByIdList(fileIds, orgId),
        TE.map((files) =>
            files.map((item) =>
                appendToArchive(item, `${path}${item}`, archive)
            )
        )
    );
}
