import { createPresignedGetAsync } from '@common/utils';
import { IFile, IFileRecord } from './type';

export async function fromFileRecordToJson(
    record: IFileRecord,
    getAssetUrl?: boolean
): Promise<IFile> {
    if (getAssetUrl) {
        const bucket = record.asset.split?.('s3://')?.[1]?.split?.('/')?.[0];
        const key = record.asset?.split?.(bucket)?.[1];
        if (bucket && key) {
            return Promise.all([
                createPresignedGetAsync(bucket, key),
                createPresignedGetAsync(bucket, key + '__fsthumb.png'),
            ]).then(async ([url, thumbnail]) => {
                const file = await fromFileRecordToJson(record);

                if (url) file.asset = url;
                if (thumbnail) file.thumbnail = thumbnail;

                return file;
            });
        } else {
            record.asset = '';
        }
    }

    return Promise.resolve({
        id: record.SK.split('#')[1],
        parent: record.PK.split('#')[1],
        name: record.name,
        asset: record.asset,
        fileSize: record.fileSize,
        fileType: record.fileType,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
        type: 'file',
    });
}
