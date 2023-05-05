import { QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { secureHash, sendReadCommand } from '../../common';
import { config } from '../../config';

interface ChallengeRecord {
    tokenHash: string;
    challenge: string;
    createdAt: number;
    expiresAt: number;
}

/**
 * Retrieves the latest challenge stored for a given accessToken.
 * If there's no match we return null and if there is we return the
 * challenge.
 *
 * It's the responsibility of the caller to match the challenge for
 * the attestation flow.
 *
 * @param accessToken Access token used to authenticate with the API.
 * @returns challenge `string` or `null`
 */
export function retrieveChallenge(accessToken: string) {
    const tokenHash = secureHash(accessToken);

    const params: QueryCommandInput = {
        TableName: config.tables.integrityTable,
        KeyConditionExpression: 'tokenHash = :tokenHash AND expiresAt >= :now',
        ExpressionAttributeValues: marshall({
            ':tokenHash': tokenHash,
            ':now': Date.now(),
        }),
    };

    return pipe(
        new QueryCommand(params),
        sendReadCommand<ChallengeRecord>,
        TE.map((data) => {
            if (data.length) {
                data.sort((a, b) => b.createdAt - a.createdAt);
                const latest = data[0];
                return latest.challenge;
            }
            return null;
        })
    );
}
