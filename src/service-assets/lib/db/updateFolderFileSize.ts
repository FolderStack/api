import {
    UpdateItemCommand,
    UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { sendWriteCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { getFolder } from './getFolder';

export function updateFolderFileSize(
    folderId: string,
    delta: number,
    orgId: string
): TE.TaskEither<Error, void> {
    return pipe(
        getFolder(folderId, orgId),
        TE.chain((result) => {
            if (result) {
                const fileSize = result.fileSize + delta;
                const updateParams: UpdateItemCommandInput = {
                    TableName: config.tables.assetTable,
                    Key: marshall({
                        PK: `Folder#${result.parent}`,
                        SK: `Folder#${result.id}`,
                    }),
                    UpdateExpression:
                        'SET fileSize = :fileSize, itemCount = itemCount + :inc',
                    ExpressionAttributeValues: marshall({
                        ':fileSize': Math.max(0, fileSize),
                        ':inc': delta < 0 ? -1 : 1, // Decrement if we're deleting.
                    }),
                };

                const command = new UpdateItemCommand(updateParams);
                return sendWriteCommand(command);
            } else {
                return TE.right(void 0);
            }
        })
    );
}
