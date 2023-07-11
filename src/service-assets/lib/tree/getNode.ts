import { GetItemCommand, GetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb } from '@common/utils';
import { config } from '@config';

export async function getNode(
    nodeId: string,
    parentId: string
): Promise<Record<string, any> | null> {
    const params: GetItemCommandInput = {
        TableName: config.tables.treeTable,
        Key: marshall({
            PK: parentId,
            SK: nodeId,
        }),
    };

    const getItem = new GetItemCommand(params);

    const { Item: node } = await dynamoDb.send(getItem);

    return node ? unmarshall(node) : null;
}
