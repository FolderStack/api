import { createId } from "../../createId";
import { ICreateRentalMessage, IRentalMessage } from "./type";

export function createRentalMessage(
    propertyId: `Property#${string}`,
    message: ICreateRentalMessage
): IRentalMessage {
    const id = createId('Message')

    return {
        ...message,
        PK: id,
        SK: propertyId,
        entityType: 'Message',
        createdAt: Date.now(),
        updatedAt: null,
        deletedAt: null,
        seenBy: []
    }
}