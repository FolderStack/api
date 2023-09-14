import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { HttpNotFoundError } from '@common/errors';
import { sendReadCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { fromFileRecordToJson } from '../fromFileRecordToJson';
import { fromFolderRecordToJson } from '../fromFolderRecordToJson';
import { IFile, IFileRecord, IFolderRecord } from '../type';
import { getFolder } from './getFolder';

function fromFileRecord(item: IFileRecord, relativePath: string) {
    const file = fromFileRecordToJson(item) as IFile & { path: string };
    file.path = relativePath; // Assuming the IFile type has a path attribute
    return TE.right([file]);
}

function fromFolderRecord(
    item: IFolderRecord,
    relativePath: string,
    orgId: string
): TE.TaskEither<Error, IFile[]> {
    const folder = fromFolderRecordToJson(item);
    if (!folder) {
        return TE.right([]);
    } else {
        return getItemsInFolder(
            `${relativePath}/${folder.name}`,
            folder.id,
            orgId
        );
    }
}

function getItemsInFolder(
    parentId: string,
    relativePath: string,
    orgId: string
): TE.TaskEither<Error, IFile[]> {
    const query: QueryCommandInput = {
        TableName: config.tables.table,
        KeyConditionExpression: `PK = :parentId`,
        ExpressionAttributeValues: marshall({
            ':parentId': `Folder#${parentId}`,
        }),
    };

    return pipe(
        new QueryCommand(query),
        sendReadCommand<IFolderRecord | IFileRecord>,
        TE.chain((items) =>
            pipe(
                items,
                TE.traverseArray((item) => {
                    if (item.entityType === 'File') {
                        return fromFileRecord(item, relativePath);
                    } else if (item.entityType === 'Folder') {
                        const newPath = `${relativePath}${item.name}/`;
                        return fromFolderRecord(item, newPath, orgId);
                    }
                    return TE.right([]);
                })
            )
        ),
        // Flatten the result into a single array
        TE.map((arrays) => arrays.flat())
    );
}

export function getContentsOfFolderDeep(
    folderId: string,
    relativePath: string,
    orgId: string
): TE.TaskEither<Error, IFile[]> {
    return pipe(
        getFolder(folderId, orgId),
        TE.chain((folder) => {
            if (!folder) {
                return TE.left(new HttpNotFoundError());
            }
            return getItemsInFolder(folderId, relativePath, orgId);
        })
    );
}
