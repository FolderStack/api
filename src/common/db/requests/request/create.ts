import { createId } from "../../createId";
import { ICreateRentalRequest, IRentalRequest, RentalRequestStatus } from "./type";

export function createRentalRequest(
    propertyId: `Property#${string}`,
    request: ICreateRentalRequest
): IRentalRequest {
    const id = createId('Request')

    return {
        ...request,
        PK: id,
        SK: propertyId,
        entityType: 'Request',
        status: RentalRequestStatus.PENDING,
        createdAt: Date.now(),
        updatedAt: null,
        deletedAt: null,
        seenAt: null,
        seenBy: null
    }
}