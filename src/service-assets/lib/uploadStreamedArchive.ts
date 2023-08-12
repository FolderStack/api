import { PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { s3 } from '@common/utils';
import { config } from '@config';
import { Archiver } from 'archiver';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { PassThrough } from 'stream';

export function uploadStreamedArchive(key: string, archive: Archiver) {
    const passThrough = new PassThrough();

    archive.pipe(passThrough);

    const commandInput: PutObjectCommandInput = {
        Bucket: config.buckets.assets,
        Key: key,
        Body: passThrough,
    };

    return pipe(
        TE.tryCatch(
            () => s3.send(new PutObjectCommand(commandInput)),
            (reason) => new Error(String(reason))
        )
    );
}
