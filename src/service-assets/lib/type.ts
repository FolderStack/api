import { HasDates, TableProperties } from '../../common/types';

export interface IFolder {
    id: string;
    name: string;
    image: string | null;
    parent: string | null;
    fileSize: number;
    itemCount: number;
    createdAt: Date;
    updatedAt: Date;
    type: 'folder';
    order?: number;
}

export interface IFolderRecord extends TableProperties, HasDates {
    PK: `Folder#${string}` | `Folder#ROOT`;
    SK: `Folder#${string}`;
    entityType: 'Folder';
    image: string | null;
    fileSize: number;
    itemCount: number;
    name: string;
    org: string; // Organisation that owns the resource.

    order?: number;
}

export interface IFolderParentRecord extends TableProperties, HasDates {
    PK: `Folder#${string}`;
    SK: `Folder#${string}` | `Folder#ROOT`;
    entityType: 'FolderParent';
    org: string;
}

export interface IFile {
    id: string;
    parent: string;
    name: string;
    asset: string;
    thumbnail?: string;
    fileSize: number;
    fileType: string;
    createdAt: Date;
    updatedAt: Date;
    type: 'file';
}

export interface IFileRecord extends TableProperties, HasDates {
    PK: `Folder#${string}`;
    SK: `File#${string}`;
    entityType: 'File';

    // The S3 Key or URL for the asset itself.
    asset: string;

    name: string;
    fileSize: number;
    fileType: string; // the EXT file type. i.e. png, jpeg, pdf etc...

    org: string; // Organisation that owns the resource.
}

export interface FileUpload {
    name: string;
    file: any;
    fileType: string;
    fileSize: number;
}
