import { HasDates, TableProperties } from "../../../types";

export enum RentalRequestStatus {
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    PENDING = 'PENDING'
}

export interface ICreateRentalRequest {
    requestedAt: number;
    requestedBy: `User#${string}`
    recordId: string
}

export interface IRentalRequest extends TableProperties, HasDates {
    PK: `Request#${string}`
    SK: `Property#${string}`
    entityType: 'Request'

    requestedAt: number
    requestedBy: `User#${string}`

    seenAt: number | null
    seenBy: `User#${string}` | null

    recordId: string

    status: RentalRequestStatus
}