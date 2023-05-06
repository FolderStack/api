import { PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { customAlphabet } from 'nanoid';
import { createAttestationChallenge, sendWriteCommand } from '../../common';
import { config } from '../../config';
const challengeDict = customAlphabet(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
);

/**
 * Use the app's access token obtained via refresh or login to retrieve a
 * random challenge string for attestation.
 *
 * The same access token has to be used in order to retrieve the challenge
 * otherwise attestation will not proceed and the client will need to try
 * again.
 *
 * @param accessToken Access token used to authenticate with the API.
 * @returns
 */
export function createAndStoreChallenge(
    device: string,
    state: string
): TE.TaskEither<Error, string> {
    const challenge = challengeDict(36);

    const record = createAttestationChallenge(
        device,
        challenge,
        Buffer.from(state).toString('base64')
    )

    const params: PutItemCommandInput = {
        TableName: config.tables.integrityTable,
        Item: marshall(record),
    };

    return pipe(
        new PutItemCommand(params),
        sendWriteCommand,
        TE.map(() => challenge)
    );
}
