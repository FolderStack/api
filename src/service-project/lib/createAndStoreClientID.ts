import { PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import * as TE from 'fp-ts/TaskEither';
import { pipe } from "fp-ts/lib/function";
import { nanoid } from 'nanoid';
import { sendWriteCommand } from "../../common";
import { config } from "../../config";
import { createClientIDRecord } from "./db";
import { IClientCredentials } from "./type";

/**
 * Create a new client credential pair for the mobile app when
 * building. This will embed the credentials in the app to store
 * in a secure location on update.
 * 
 * @param version The version of the app to create & store.
 * @returns 
 */
export function createAndStoreClientID(version: string, clientType: 'cli' | 'app'): TE.TaskEither<Error, IClientCredentials> {

    const clientId = Buffer.from(nanoid(16)).toString('hex') // 32bits
    const clientSecret = Buffer.from(nanoid(24)).toString('hex')
    const record = createClientIDRecord(version, clientId, clientSecret, clientType);

    const params: PutItemCommandInput = {
        TableName: config.tables.integrityTable,
        Item: marshall(record)
    }

    return pipe(
        new PutItemCommand(params),
        sendWriteCommand,
        TE.map(() => ({
            clientId,
            clientSecret,
            clientType,
            version,
            createdAt: record.createdAt,
            updatedAt: null,
            deletedAt: null
        }))
    )
}