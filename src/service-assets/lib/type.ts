import { HasDates, TableProperties } from '../../common/types';

export interface IFolder {
    id: string;
    name: string;
    image: string | null;
    parent: string | null;
    fileSize: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IFolderRecord extends TableProperties, HasDates {
    PK: `Folder#${string}`;
    SK: `Parent#${string}` | `Parent#ROOT`;
    entityType: 'Folder';
    image: string | null;
    fileSize: number;
    name: string;
    org: string; // Organisation that owns the resource.
}

export interface IFile {
    id: string;
    name: string;
    asset: string;
    fileSize: number;
    fileType: string;
    createdAt: Date;
    updatedAt: Date;
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
