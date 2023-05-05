import { randomUUID } from "crypto";
import { ICreateProperty, IProperty } from "./type";
import { IPropertyAddress, createPropertyAddress } from "../address";
import { IPropertyConfiguration, createPropertyConfiguration } from "../configuration";
import { createId } from "../../createId";

interface ICreatePropertyReturn {
    property: IProperty
    address: IPropertyAddress
    configuration: IPropertyConfiguration
}

export function createProperty(property: ICreateProperty): ICreatePropertyReturn {
    const id = createId('Property')
    const address = createPropertyAddress(id, property.address)
    const configuration = createPropertyConfiguration(id, property.configuration)

    return {
        property: {
            PK: id,
            SK: id,
            entityType: 'Property',
            friendlyName: property.friendlyName ?? null,
            addressId: address.PK,
            configId: configuration.PK,
            mediaIds: [],
            createdAt: Date.now(),
            updatedAt: null,
            deletedAt: null
        },
        address,
        configuration
    }
}
