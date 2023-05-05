import { createId } from "../../createId";
import { ICreateRentalRecord, IRentalRecord } from "./type";

export function createRentalRecord(
    propertyId: `Property#${string}`,
    record: ICreateRentalRecord
): IRentalRecord {
    const id = createId('Record')

    return {
        PK: id,
        SK: propertyId,
        entityType: 'Record',
        createdAt: Date.now(),
        updatedAt: null,
        deletedAt: null,
        ...record
    }
}