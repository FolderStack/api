import { ScanCommand } from '@aws-sdk/client-dynamodb';
import { ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { sendReadCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { fromFileRecordToJson } from '../fromFileRecordToJson';
import { IFile, IFileRecord } from '../type';

export function getFilesByIdList(
    ids: string[],
    org: string
): TE.TaskEither<Error, IFile[]> {
    const scanInput: ScanCommandInput = {
        TableName: config.tables.table,
        ScanFilter: {
            SK: {
                AttributeValueList: ids.map((id) => `File#${id}`),
                ComparisonOperator: 'IN',
            },
            org: {
                AttributeValueList: [org],
                ComparisonOperator: 'EQ',
            },
        },
    };

    return pipe(
        new ScanCommand(scanInput),
        sendReadCommand<IFileRecord>,
        TE.map((items) => items.map((record) => fromFileRecordToJson(record)))
    );
}
