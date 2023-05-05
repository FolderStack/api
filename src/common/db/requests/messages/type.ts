import { HasDates, TableProperties } from "../../../types";

export interface ICreateRentalMessage {
    requestId: string;
    from: `User#${string}`
    to: `User#${string}` | `User#${string}`[] | null
    message: string
}

export interface IRentalMessage extends TableProperties, HasDates {
    PK: `Message#${string}`
    SK: `Property#${string}`
    entityType: 'Message'

    from: `User#${string}`
    to: `User#${string}` | `User#${string}`[] | null

    requestId: string
    
    message: string;

    seenBy: `User#${string}`[]
}