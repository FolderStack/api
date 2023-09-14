import { Upload } from '@aws-sdk/lib-storage';
import { logger, s3 } from '@common/utils';
import { config } from '@config';
import { PassThrough } from 'stream';

export function getWritableStreamFromS3(key: string) {
    let _passthrough = new PassThrough();

    logger.debug('Getting write stream at key: ' + key);

    new Upload({
        client: s3,
        params: {
            Bucket: config.buckets.assets,
            Key: key,
            Body: _passthrough,
        },
    }).done();

    return _passthrough;
}
