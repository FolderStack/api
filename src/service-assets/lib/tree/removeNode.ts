import {
    DeleteItemCommand,
    DeleteItemCommandInput,
    DeleteItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb } from '@common/utils';
import { config } from '@config';

interface RemoveNodeTransaction {
    Delete: DeleteItemCommandInput;
}

export function removeNode(
    nodeId: string,
    parentId: string,
    transact: true
): RemoveNodeTransaction;
export function removeNode(
    nodeId: string,
    parentId: string,
    transact?: undefined | false
): Promise<DeleteItemCommandOutput>;
export function removeNode(
    nodeId: string,
    parentId: string,
    transact: undefined | boolean
): Promise<DeleteItemCommandOutput> | RemoveNodeTransaction {
    const params: DeleteItemCommandInput = {
        TableName: config.tables.treeTable,
        Key: marshall({
            PK: parentId,
            SK: nodeId,
        }),
    };

    if (transact) return { Delete: params };

    const deleteItem = new DeleteItemCommand(params);

    return dynamoDb.send(deleteItem);
}
