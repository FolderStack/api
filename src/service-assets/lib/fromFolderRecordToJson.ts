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

export function fromJsonToFolderRecord(json: any): IFolderRecord {
    const item: Partial<IFolderRecord> = {
        PK: `Folder#${json.parent ?? 'ROOT'}`,
        SK: `Folder#${json.id}`,
        entityType: 'Folder',
    };

    if (json.name && typeof json.name === 'string') item.name = json.name;
    if (json.image && typeof json.image === 'string') item.image = json.image;
    if (typeof json.fileSize === 'number') item.fileSize = json.fileSize;
    if (typeof json.itemCount === 'number') item.itemCount = json.itemCount;
    if (json.createdAt) item.createdAt = new Date(json.createdAt).getTime();
    if (json.updatedAt) item.updatedAt = new Date(json.updatedAt).getTime();
    if (json.deletedAt) item.deletedAt = new Date(json.deletedAt).getTime();
    if (typeof json.order === 'number') item.order = json.order;
    if (json.org && typeof json.org === 'string') item.org = json.org;

    return item as IFolderRecord;
}
