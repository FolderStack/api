import { IFile, IFileRecord } from './type';

export function fromFileRecordToJson(record: IFileRecord): IFile {
    return {
        id: record.SK.split('#')[1],
        name: record.name,
        asset: record.asset,
        fileSize: record.fileSize,
        fileType: record.fileType,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
    };
}
