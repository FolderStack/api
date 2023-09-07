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
import { IFile, IFileRecord, IFolder, IFolderRecord } from '../type';
import { getFolder } from './getFolder';

function fromFileRecord(item: IFileRecord) {
    return pipe(TE.right([fromFileRecordToJson(item)]));
}

function fromFolderRecord(
    item: IFolderRecord,
    relativePath: string,
    orgId: string
): TE.TaskEither<Error, (IFile | IFolder)[]> {
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
): TE.TaskEither<Error, (IFile | IFolder)[]> {
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
            TE.traverseArray((item: IFolderRecord | IFileRecord) => {
                if (item.org !== orgId) return TE.right(null);
                if (item.entityType === 'File') {
                    return pipe(
                        TE.tryCatch(
                            () => fromFileRecordToJson(item),
                            err => err as Error
                        ),
                        TE.map(res => [res])
                    );
                }
                if (item.entityType === 'Folder') {
                    return fromFolderRecord(item, relativePath, orgId);
                }
                return TE.right([]);
            })(items)
        ),
        TE.map((items) =>
            items
                .filter((item): item is (IFile | IFolder)[] => item !== null)
                .flat()
        )
    );
}

export function getContentsOfFolderDeep(
    folderId: string,
    orgId: string
): TE.TaskEither<Error, (IFile | IFolder)[]> {
    return pipe(
        getFolder(folderId, orgId),
        TE.chain((folder) => {
            if (!folder) {
                return TE.left(new HttpNotFoundError());
            }
            return getItemsInFolder(folderId, '/', orgId);
        })
    );
}
