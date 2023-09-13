import { createPresignedGetAsync, logger } from '@common/utils';
import { IFile, IFileRecord } from './type';

export function fromFileRecordToJson(
    record: IFileRecord,
    getAssetUrl?: false | undefined
): IFile;
export function fromFileRecordToJson(
    record: IFileRecord,
    getAssetUrl: true
): Promise<IFile>;
export async function fromFileRecordToJson(
    record: IFileRecord,
    getAssetUrl?: boolean
): Promise<IFile> | IFile {
    logger.debug('fromFileRecordToJson', { record, getAssetUrl });
    if (getAssetUrl) {
        let bucket: string | undefined, key: string | undefined;

        // Handle cases where the asset url is a FQDN with the bucket and key
        if (record.asset) {
            if (record.asset.startsWith('http')) {
                const [subdomainWithProtocol = '', restOfUrl = ''] =
                    record.asset.split(/\.(.*)/);
                bucket = subdomainWithProtocol.split('://')[1];
                key = restOfUrl.split(/\/(.*)/)[1];
            } else {
                // .. or if the asset url is an s3://{bucket}/{key} url
                const pathWithoutProtocol = record.asset.split('://')[1] ?? '';
                bucket = pathWithoutProtocol.split('/')[0];
                key = record.asset.split(String(bucket) + '/')[1];
            }
        }

        logger.debug('fromFileRecordToJson', { bucket, key });
        if (bucket?.length && key?.length) {
            const keyWithoutExt = key
                .split(/(.*)\./)
                .filter((k) => k.length)[0];
            try {
                const result = await Promise.allSettled([
                    createPresignedGetAsync(bucket, key),
                    // Using allSettled in case the thumbnail hasn't generated
                    // ...avoids no key found errors
                    createPresignedGetAsync(
                        bucket,
                        keyWithoutExt + '__fsthumb.png'
                    ),
                ]);

                const file = fromFileRecordToJson(record);

                const [urlSettled, thumbSettled] = result;
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

                logger.debug('fromFileRecordToJson', { file });

                return file;
            } catch (err) {
                console.log(err);
                logger.debug('fromFileRecordToJson', {
                    error: true,
                    error_info: err,
                });
                return fromFileRecordToJson(record);
            }
        } else {
            record.asset = '';
        }
    }

    return {
        id: record.SK.split('#')[1],
        parent: record.PK.split('#')[1],
        name: record.name,
        asset: record.asset,
        fileSize: record.fileSize,
        fileType: record.fileType,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
        type: 'file',
    };
}
