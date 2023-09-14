import { createPresignedGetAsync, logger } from '@common/utils';
import { IFile, IFileRecord } from './type';

export async function fromFileRecordToJsonWithSignedImageUrls(
    record: IFileRecord
) {
    const file = fromFileRecordToJson(record);

    try {
        let bucket: string | undefined, key: string | undefined;

        // Handle cases where the asset url is a FQDN with the bucket and key
        if (file.asset) {
            if (file.asset.startsWith('http')) {
                const [subdomainWithProtocol = '', restOfUrl = ''] =
                    file.asset.split(/\.(.*)/);
                bucket = subdomainWithProtocol.split('://')[1];
                key = restOfUrl.split(/\/(.*)/)[1];
            } else {
                // .. or if the asset url is an s3://{bucket}/{key} url
                const pathWithoutProtocol = file.asset.split('://')[1] ?? '';
                bucket = pathWithoutProtocol.split('/')[0];
                key = file.asset.split(String(bucket) + '/')[1];
            }
        }

        if (bucket?.length && key?.length) {
            const keyWithoutExt = key
                .split(/(.*)\./)
                .filter((k) => k.length)[0];

            const [urlSettled, thumbSettled] = await Promise.allSettled([
                createPresignedGetAsync(bucket, key),
                // Using allSettled in case the thumbnail hasn't generated
                // ...avoids no key found errors
                createPresignedGetAsync(
                    bucket,
                    keyWithoutExt + '__fsthumb.png'
                ),
            ]);
            logger.debug('fileRecord', { fileRecord: file });

            logger.debug('settled results', {
                urlSettled,
                thumbSettled,
            });

            if (urlSettled.status === 'fulfilled') {
                const url = urlSettled.value;
                if (url) {
                    file.asset = url;
                }
            }

            if (thumbSettled.status === 'fulfilled') {
                const thumb = thumbSettled.value;
                if (thumb) {
                    file.thumbnail = thumb;
                }
            }

            logger.debug('file with presigned urls', { file });
        }
    } catch (err: any) {
        console.log(err);
        logger.debug('error', {
            error: true,
            error_info: err,
        });
    }

    return file;
}

export function fromFileRecordToJson(record: IFileRecord): IFile {
    return {
        id: record.SK.split('#')[1],
        parent: record.PK.split('#')[1],
        name: record.name,
        asset: record.asset,
        fileSize: record.fileSize,
        fileType: record.fileType,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
        file: record.file,
        type: 'file',
    };
}
