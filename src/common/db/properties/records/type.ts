import { HasDates, TableProperties } from "../../../types";

export interface ICreateRentalRecord {
    media: string[]
    message: string;
    createdBy: string;
    status: 'DRAFT' | 'PUBLISHED'
}

export interface IRentalRecord extends TableProperties, HasDates {
    PK: `Record#${string}`
    SK: `Property#${string}`
    entityType: 'Record'

    /**
     * Array of media IDs to be attached to the record.
     */
    media: string[]

    /**
     * The message to be attached to the record.
     * This can be a response to a tenant or a manager,
     * or just a postscript of the attached files.
     */
    message: string;

    /**
     * Record status, allows the record to be edited
     * or saved and changed later while files or messages
     * are being organised.
     */
    status: 'DRAFT' | 'PUBLISHED'

    /**
     * User ID of the creator
     */
    createdBy: string;
}