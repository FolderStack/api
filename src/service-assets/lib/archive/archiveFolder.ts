import { logger } from '@common/utils';
import { Archiver } from 'archiver';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { Readable } from 'stream';
import { getContentsOfFolderDeep } from '../db/getContentsOfFolderDeep';
import { IFile } from '../type';
import { getReadableStreamFromS3Async } from './getReadableStreamForS3';
import { getWritableStreamFromS3 } from './getWritableStreamForS3';

export function archiveFolder(
    archive: Archiver,
    zipKey: string,
    folder: string,
    orgId: string
) {
    function addToArchive(item: IFile): TE.TaskEither<Error, void> {
        if (item.type === 'file' && 'path' in item) {
            return pipe(
                TE.tryCatch(
                    async () => {
                        const s3ReadableStream =
                            await getReadableStreamFromS3Async(item.asset);
                        if (s3ReadableStream) {
                            archive.append(<Readable>s3ReadableStream, {
                                name: String(item.path),
                            });
                        } else {
                            logger.debug('Skipped file at key: ' + item.asset);
                        }
                    },
                    (e: any) =>
                        new Error(`Failed to add file to archive: ${e.message}`)
                )
            );
        }
        return TE.right(undefined);
    }

    return pipe(
        getContentsOfFolderDeep(folder, '/', orgId),
        TE.chain((contents) =>
            pipe(
                TE.sequenceArray(contents.map(addToArchive)),
                TE.chain(() => {
                    // Now, finalize the archive and send it to S3
                    const s3WritableStream = getWritableStreamFromS3(zipKey);
                    archive.pipe(s3WritableStream);
                    return TE.tryCatch(
                        () => archive.finalize(),
                        (e: any) =>
                            new Error(
                                `Failed to finalize archive: ${e.message}`
                            )
                    );
                })
            )
        )
    );
}
