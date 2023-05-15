import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { IAttestationChallenge } from '@common/types';
import { logger, sendReadCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';

export function getClientDataByChallenge(
    challenge: string, 
    device: string
): TE.TaskEither<Error, IAttestationChallenge> {
    logger.debug('Begin: getClientDataByChallenge');
    const params: QueryCommandInput = {
        TableName: config.tables.integrityTable,
        KeyConditionExpression: 'PK = :device AND SK = :challenge',
        ExpressionAttributeValues: marshall({
            ':device': `Device#${device}`,
            ':challenge': `Challenge#${challenge}`,
        }),
        Limit: 1,
    };

    return pipe(
        new QueryCommand(params),
        sendReadCommand<IAttestationChallenge>,
        TE.map((data) => {
            logger.debug(`Found challenge: ${Boolean(data.length)}`);
            return data[0];
        })
    );
}
