import { HttpBadRequestError } from '@common/errors';
import { ZodError, z } from 'zod';

export function validate<T>(data: unknown, schema: z.Schema<T>): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof ZodError) {
            // Get the first error type and message
            const firstError = error.errors[0];

            let messageType = '';
            switch (firstError.code) {
                case 'invalid_type':
                    messageType = firstError.expected;
                    break;
                // Add other error types if you need to handle them
                default:
                    messageType = 'valid value'; // Default message, can be adjusted
            }

            // Use firstError.path to determine which field caused the error
            const fieldPath = firstError.path.join('.');
            const errorMessage = `Expected '${fieldPath}' to be a ${messageType}${
                'received' in firstError
                    ? `, received '${firstError.received}'`
                    : ''
            }`;

            throw new HttpBadRequestError(errorMessage);
        } else {
            // If the error is not a ZodError
            throw new HttpBadRequestError(`Failed to validate '${name}'`);
        }
    }
}

// function isTypeOf<T>(
//     value: unknown,
//     type: BaseType | ValidatorItemConfig<BaseType>
// ): value is T {
//     if (typeof type === 'object' && 'type' in type) {
//         type = type.type;
//     }
//     switch (type) {
//         case 'string':
//             return typeof value === 'string';
//         case 'number':
//             return typeof value === 'number';
//         case 'boolean':
//             return typeof value === 'boolean';
//         case 'object':
//             return (
//                 typeof value === 'object' &&
//                 !Array.isArray(value) &&
//                 value !== null
//             );
//         case 'array':
//             return Array.isArray(value);
//         default:
//             return false;
//     }
// }

// type BaseType = 'string' | 'number' | 'boolean' | 'object' | 'array';

// type ValidatorItemConfig<T = BaseType> = {
//     type: T;
//     nullable?: boolean;
// };

// type InferType<T> = T extends 'string'
//     ? string
//     : T extends 'number'
//     ? number
//     : T extends 'boolean'
//     ? boolean
//     : T extends { type: 'string' }
//     ? string
//     : T extends { type: 'number' }
//     ? number
//     : T extends { type: 'boolean' }
//     ? boolean
//     : T extends { type: 'object'; fields: infer U }
//     ? { [K in keyof U]: InferType<U[K]> }
//     : T extends { type: 'array'; item: infer U; nullable?: false }
//     ? Array<InferItem<U>>
//     : T extends { type: 'array'; item: infer U; nullable: true }
//     ? Array<InferItem<U>> | null
//     : never;

// type InferItem<T> = T extends 'string'
//     ? string
//     : T extends 'number'
//     ? number
//     : T extends 'boolean'
//     ? boolean
//     : T extends { type: 'string' }
//     ? string
//     : T extends { type: 'number' }
//     ? number
//     : T extends { type: 'boolean' }
//     ? boolean
//     : T extends { type: 'object'; fields: infer U }
//     ? { [K in keyof U]: InferType<U[K]> }
//     : never;

// type ValidatorConfigValue =
//     | BaseType
//     | ValidatorItemConfig<BaseType>
//     | ObjectValidatorItem
//     | ArrayValidatorItem;

// type ValidatorConfig = { [key: string]: ValidatorConfigValue };

// type ObjectValidatorItem = ValidatorItemConfig<'object'> & {
//     fields: ValidatorConfig;
// };

// type ArrayValidatorItem = ValidatorItemConfig<'array'> & {
//     item: BaseType | ValidatorItemConfig;
// };

// export function validateObject<T extends ValidatorConfig>(
//     input: unknown,
//     config: T
// ): { [K in keyof T]: InferType<T[K]> } {
//     if (typeof input !== 'object' || input === null) {
//         throw new Error();
//     }

//     const output: Partial<{ [K in keyof T]: any }> = {};

//     for (const key in config) {
//         const value = (input as any)[key];
//         const validator = config[key];

//         let type: BaseType;
//         let nullable: boolean = false;

//         if (typeof validator === 'string') {
//             type = validator as BaseType;
//         } else {
//             type = validator.type;
//             nullable = validator.nullable || false;
//         }

//         if (nullable && (value === null || value === undefined)) {
//             output[key] = value;
//             continue;
//         }

//         if (!isTypeOf(value, type)) {
//             throw new HttpBadRequestError(`Expected '${key}' to be a ${type}`);
//         }

//         if (
//             type === 'object' &&
//             typeof validator === 'object' &&
//             'fields' in validator &&
//             validator.fields
//         ) {
//             output[key] = validateObject(value, validator.fields); // Recursive call for nested objects
//         } else if (
//             type === 'array' &&
//             typeof validator === 'object' &&
//             'item' in validator &&
//             validator.item
//         ) {
//             if (typeof validator.item === 'string') {
//                 // For simple types, just check type without recursively calling validateObject
//                 output[key] = (value as any[]).map((item) => {
//                     if (!isTypeOf(item, validator.item)) {
//                         throw new HttpBadRequestError(
//                             `Expected array item to be a ${validator.item}`
//                         );
//                     }
//                     return item;
//                 });
//             } else {
//                 // For complex types, use recursive validation
//                 output[key] = (value as any[]).map((item) => {
//                     if (typeof validator.item === 'object') {
//                         return validateObject(item, { item: validator.item });
//                     } else {
//                         return validateObject(item, {
//                             item: validator.item as BaseType,
//                         });
//                     }
//                 });
//             }
//         } else {
//             output[key] = value;
//         }
//     }

//     return output as { [K in keyof T]: any };
// }
