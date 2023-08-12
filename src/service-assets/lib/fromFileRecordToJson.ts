import { createPresignedGetAsync } from './createPresignedUrl';
import { IFile, IFileRecord } from './type';

export function fromFileRecordToJson(
    record: IFileRecord,
    getAssetUrl?: false
): IFile;
export function fromFileRecordToJson(
    record: IFileRecord,
    getAssetUrl: true
): Promise<IFile>;
export function fromFileRecordToJson(
    record: IFileRecord,
    getAssetUrl?: boolean
): Promise<IFile> | IFile {
    if (getAssetUrl) {
        const bucket = record.asset.split('s3://')[1].split('/')[0];
        const key = record.asset.split(bucket)[1];
        return Promise.all([
            createPresignedGetAsync(bucket, key),
            createPresignedGetAsync(bucket, key + '__fsthumb.png'),
        ]).then(([url, thumbnail]) => {
            const file = fromFileRecordToJson(record);

            if (url) file.asset = url;
            if (thumbnail) file.thumbnail = thumbnail;

            return file;
        });
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
