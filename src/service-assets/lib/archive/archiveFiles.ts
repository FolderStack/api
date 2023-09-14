import { createPresignedGetAsync, logger } from '@common/utils';
import { config } from '@config';
import { Archiver } from 'archiver';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import * as _ from 'lodash';
import { Readable } from 'stream';
import { getFilesByIdList } from '../db/getFilesByIdList';
import { getReadableStreamFromS3Async } from './getReadableStreamForS3';
import { getWritableStreamFromS3 } from './getWritableStreamForS3';

export function archiveFiles(
    archive: Archiver,
    zipKey: string,
    fileIds: string[],
    orgId: string
) {
    return pipe(
        getFilesByIdList(fileIds, orgId),
        TE.map((files) => {
            logger.debug('archiveFiles: fileKeys', {
                files,
                keys: files.map((f) => f.file),
            });
            return files.map((f) => f.file);
        }),
        TE.chain((keys) => {
            logger.debug('... chain', { keys });
            return TE.tryCatch(
                () => createArchiveStream(archive, zipKey, keys),
                (err: any) => new Error(String(err?.message))
            );
        })
    );
}

const BATCH_SIZE = Number(process.env.ARCHIVE_BATCH_SIZE) || 10;

async function createArchiveStream(
    zip: Archiver,
    zipKey: string,
    s3Keys: string[]
) {
    logger.debug('S3 Keys', { s3Keys, zipKey });
    const chunkedS3Keys = _.chunk(s3Keys, BATCH_SIZE);

    let currentBatch = 0;
    for (const chunk of chunkedS3Keys) {
        currentBatch++;
        const streamPromises = chunk.map(async (s3Key) => {
            try {
                const s3ReadableStream = await getReadableStreamFromS3Async(
                    s3Key
                );
                logger.debug(`s3ReadableStream: ${!!s3ReadableStream}`);
                if (s3ReadableStream) {
                    const name = s3Key.split('/').pop()!;
                    logger.debug(`s3ReadableStream name: '${name}'`);
                    zip.append(<Readable>s3ReadableStream, { name });
                } else {
                    logger.debug(
                        `Skipped file at key: '${s3Key}' in batch #${currentBatch}.`
                    );
                }
            } catch (error: any) {
                logger.error(
                    `Failed to process file at key: ${s3Key}. Error: ${error.message}`
                );
            }
        });

        await Promise.all(streamPromises);
    }

    const s3WritableStream = getWritableStreamFromS3(zipKey);
    zip.pipe(s3WritableStream);

    const [, url] = await Promise.all([
        zip.finalize(),
        createPresignedGetAsync(config.buckets.assets, zipKey),
    ]);

    return { url };
}
