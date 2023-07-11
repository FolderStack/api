import {
    TransactWriteItemsCommand,
    TransactWriteItemsCommandInput,
} from '@aws-sdk/client-dynamodb';
import { dynamoDb } from '@common/utils';
import { addNode } from './addNode';
import { getNode } from './getNode';
import { removeNode } from './removeNode';

export async function orderNodes(
    parentId: string,
    orderedNodeIds: string[],
    org: string
): Promise<void> {
    const transactItems: any[] = [];

    for (let i = 0; i < orderedNodeIds.length; i++) {
        const id = orderedNodeIds[i];
        const node = await getNode(id, parentId);

        const deleteAction = removeNode(id, parentId, true);
        const putAction = addNode(
            `${i}_${id}`,
            parentId,
            node ?? {},
            org,
            true
        );

        transactItems.push(deleteAction, putAction);
    }

    const transactParams: TransactWriteItemsCommandInput = {
        TransactItems: transactItems,
    };

    const transactCommand = new TransactWriteItemsCommand(transactParams);
    await dynamoDb.send(transactCommand);
}
