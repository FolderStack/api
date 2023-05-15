import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ClientBundleIOS } from "@common/types";
import { logger, sendReadCommand } from "@common/utils";
import { config } from "@config";
import { pipe } from "fp-ts/function";
import * as TE from 'fp-ts/TaskEither';

export function getClientByBundleId(
    bundleId: string
): TE.TaskEither<Error, ClientBundleIOS> {
    logger.debug('Begin: getClientByBundleId');
    const params: QueryCommandInput = {
        TableName: config.tables.integrityTable,
        KeyConditionExpression: 'PK = :bundleID',
        ExpressionAttributeValues: marshall({
            ':bundleId': `BundleID#${bundleId}`,
        }),
        Limit: 1,
    };
    
    return pipe(
        new QueryCommand(params),
        sendReadCommand<ClientBundleIOS>,
        TE.map(([client]) => {
            logger.debug(`Found client: ${Boolean(client.SK)}`);
            return client;
        })
    );
}