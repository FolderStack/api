import { IFolder, IFolderRecord } from './type';

export function fromFolderRecordToJson(record: IFolderRecord): IFolder {
    return {
        id: record.SK.split('#')[1],
        parent: record.PK.split('#')[1],
        name: record.name,
        image: record.image,
        fileSize: record.fileSize,
        itemCount: record.itemCount,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
        order: record.order,
        type: 'folder',
    };
}
