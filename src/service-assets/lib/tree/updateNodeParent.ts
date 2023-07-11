import {
    TransactWriteItemsCommand,
    TransactWriteItemsCommandInput,
} from '@aws-sdk/client-dynamodb';
import { dynamoDb } from '@common/utils';
import { addNode } from './addNode';
import { getNode } from './getNode';
import { removeNode } from './removeNode';

export async function updateNodeParent(
    nodeId: string,
    oldParentId: string,
    newParentId: string,
    org: string
): Promise<void> {
    // Get the node's data
    const node = await getNode(nodeId, oldParentId);

    const deleteAction = removeNode(nodeId, oldParentId, true);
    const putAction = addNode(nodeId, newParentId, node?.data ?? {}, org, true);

    const transactParams: TransactWriteItemsCommandInput = {
        TransactItems: [deleteAction, putAction],
    };

    const transactCommand = new TransactWriteItemsCommand(transactParams);
    await dynamoDb.send(transactCommand);
}
