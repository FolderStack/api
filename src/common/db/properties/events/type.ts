import { HasDates, TableProperties } from "../../../types";

export const RentalEventTypes = [
    // Maintenance
    'maintenance-noticed',
    'maintenance-completed',
    'maintenance-cancelled',
    'maintenance-disputed',
    'maintenance-denied',

    // Entry (Sale, Inspection etc...)
    'entry-noticed',
    'entry-completed',
    'entry-cancelled',
    'entry-disputed',
    'entry-denied',

    // Bills
    'bill-noticed',
    'bill-paid',
    'bill-disputed',
    'bill-cancelled'
] as const
export type TRentalEventType = typeof RentalEventTypes[number]

export interface ICreateRentalEvent {
    type: TRentalEventType
    recordId: string 
    sentBy: string // ID of person sending event (Tenant or Property Manager)
    sentTo: string[] | null // null if sent to everyone
    sentAt: number
}

export interface IRentalEvent extends TableProperties, HasDates {
    PK: `Event#${string}`
    SK: `Property#${string}#${string}`
    entityType: 'Event'
    
    /**
     * The type of event occuring
     */
    type: TRentalEventType

    /**
     * Attached rental record (ID)
     * 
     * Example:
     * 1. For a bill, the record would be something like a RentalBillNoticed item
     * 2. For entry notice, the record would be something like a EntryNoticed item
     * 3. For maintenance, the record would be something like a MaintenanceItemsRecieved item
     */
    record: string;

    /**
     * Time that the event was dispatched
     */
    sentAt: number;

    /**
     * Property Manager ID that the event
     * was dispatched by.
     */
    sentBy: string;

    /**
     * User IDs that the event is being sent to.
     */
    sentTo: string[] | null;
}