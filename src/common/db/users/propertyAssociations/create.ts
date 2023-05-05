import { normaliseDate } from "../../normaliseDate";
import { IUserPropertyAssociation } from "./type";

export function createPropertyAssociation(
    userId: `User#${string}`,
    propertyId: `Property#${string}`,
    contribution: number,
    startDate: Date
): IUserPropertyAssociation {
    const date = normaliseDate(startDate.getTime());

    return {
        PK: userId,
        SK: `${propertyId}#${date}`,
        entityType: 'UserPropertyAssociation',
        propertyId,
        contribution,
        startDate: startDate.getTime(),
        endDate: null,
        createdAt: Date.now(),
        updatedAt: null,
        deletedAt: null
    }
}