import { randomUUID } from "crypto";
import { IPropertyAddress, ICreatePropertyAddress } from "./type";

export function createPropertyAddress(
    propertyId: `Property#${string}`, 
    address: ICreatePropertyAddress
): IPropertyAddress {
    const id = randomUUID()
    return {
        PK: `PropertyAddress#${id}`,
        SK: propertyId,
        entityType: 'PropertyAddress',
        ...address
    }
}