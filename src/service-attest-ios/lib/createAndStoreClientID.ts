import { PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb";
import { secureHash, sendWriteCommand } from "../../common";
import { config } from "../../config";
import { marshall } from "@aws-sdk/util-dynamodb";
import { nanoid } from 'nanoid'
import { pipe } from "fp-ts/lib/function";
import * as TE from 'fp-ts/TaskEither'

interface IClientCredentials {
    clientId: string
    clientSecret: string
    clientType: string
    version: string
}

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

    const params: PutItemCommandInput = {
        TableName: config.tables.verificationChallengeTable,
        Item: marshall({
            PK: `Version#${version}`,
            SK: `ClientID#${clientId}`,
            entityType: 'ClientCredentials',
            clientSecret,
            clientType,
            createdAt: Date.now(),
        })
    }

    return pipe(
        new PutItemCommand(params),
        sendWriteCommand,
        TE.map(() => ({
            clientId,
            clientSecret,
            clientType,
            version
        }))
    )
}