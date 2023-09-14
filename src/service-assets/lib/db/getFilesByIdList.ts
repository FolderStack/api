import { ScanCommand } from '@aws-sdk/client-dynamodb';
import { ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { sendReadCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { IFileRecord } from '../type';

export function getFilesByIdList(
    ids: string[],
    org: string
): TE.TaskEither<Error, IFileRecord[]> {
    const scanInput: ScanCommandInput = {
        TableName: config.tables.table,
        ScanFilter: {
            SK: {
                AttributeValueList: ids.map((id) => ({ S: `File#${id}` })),
                ComparisonOperator: 'IN',
            },
            org: {
                AttributeValueList: [{ S: org }],
                ComparisonOperator: 'EQ',
            },
        },
    };

    return pipe(new ScanCommand(scanInput), sendReadCommand<IFileRecord>);
}
