import { randomUUID } from "crypto";
import { IPropertyConfiguration, ICreatePropertyConfiguration } from "./type";

export function createPropertyConfiguration(
    propertyId: `Property#${string}`, 
    configuration: ICreatePropertyConfiguration
): IPropertyConfiguration {
    const id = randomUUID()
    return {
        PK: `PropertyConfiguration#${id}`,
        SK: propertyId,
        entityType: 'PropertyConfiguration',
        ...configuration
    }
}