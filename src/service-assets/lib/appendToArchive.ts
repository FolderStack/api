import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '@common/utils';
import { config } from '@config';
import { Archiver } from 'archiver';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import type { Readable } from 'stream';
import { IFile } from './type';

export function appendToArchive(
    file: IFile,
    relativePath: string,
    archive: Archiver
) {
    return pipe(
        TE.tryCatch(
            () =>
                s3.send(
                    new GetObjectCommand({
                        Bucket: config.buckets.assets,
                        Key: file.asset
                            .split(config.buckets.assets + '/')
                            .pop(),
                    })
                ),
            (reason) => new Error(String(reason))
        ),
        TE.chain((s3Response) =>
            TE.tryCatch(
                () => {
                    archive.append(s3Response.Body as Readable, {
                        name: `${relativePath}/${file.name}`,
                    });
                    return Promise.resolve();
                },
                (reason) => new Error(String(reason))
            )
        )
    );
}
