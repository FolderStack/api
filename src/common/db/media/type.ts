import { HasDates, TableProperties } from "../../types";

export interface ICreateMedia {
    s3Key: string

    fileName: string
    fileType: 'png' | 'jpeg' | 'pdf'
}

export interface IMedia extends TableProperties, HasDates {
    PK: `Media#${string}`;
    SK: `Property${string}#${string}`; // Media#PropertyId#Date
    entityType: 'Media'

    s3Key: string
    fileName: string
    fileType: 'png' | 'jpeg' | 'pdf'

    createdBy: string
}