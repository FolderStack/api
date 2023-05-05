import { createId } from "../../createId";
import { normaliseDate } from "../../normaliseDate";
import { ICreateRentalEvent, IRentalEvent } from "./type";

export function createRentalEvent(
    propertyId: `Property#${string}`,
    event: ICreateRentalEvent
): IRentalEvent {
    const id = createId('Event')
    const date = normaliseDate(Date.now())

    return {
        PK: id,
        SK: `${propertyId}#${date}`,
        entityType: 'Event',
        createdAt: Date.now(),
        updatedAt: null,
        deletedAt: null,
        type: event.type,
        sentBy: event.sentBy,
        sentTo: event.sentTo,
        sentAt: event.sentAt,
        record: event.recordId
    }
}