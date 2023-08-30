import { createPresignedGet } from '@common/utils';
import { config } from '@config';
import { Archiver } from 'archiver';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { uploadStreamedArchive } from '../uploadStreamedArchive';
import { archiveFiles } from './archiveFiles';
import { archiveFolder } from './archiveFolder';

export function zipFolder(
    archiver: Archiver,
    key: string,
    folderId: string,
    org: string
) {
    const archiveTask = archiveFolder(folderId, org, archiver);

    return pipe(
        archiveTask,
        TE.chain((_) =>
            TE.tryCatch(
                () => archiver.finalize(),
                (reason) => new Error(String(reason))
            )
        ),
        TE.chain((_) => uploadStreamedArchive(key, archiver)),
        TE.chain((_) => createPresignedGet(config.buckets.assets, key))
    );
}

export function zipSelection(
    archiver: Archiver,
    key: string,
    folderId: string,
    selection: string[],
    org: string
) {
    const archiveTask = archiveFiles(archiver, '/', folderId, selection, org);

    return pipe(
        archiveTask,
        TE.chain((_) =>
            TE.tryCatch(
                () => archiver.finalize(),
                (reason) => new Error(String(reason))
            )
        ),
        TE.chain((_) => uploadStreamedArchive(key, archiver)),
        TE.chain((_) => createPresignedGet(config.buckets.assets, key))
    );
}
