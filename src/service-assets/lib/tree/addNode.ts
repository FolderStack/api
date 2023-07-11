import {
    PutItemCommand,
    PutItemCommandInput,
    PutItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb } from '@common/utils';
import { config } from '@config';

interface AddNodeTransaction {
    Put: PutItemCommandInput;
}

export function addNode(
    nodeId: string,
    parentId: string,
    data: any,
    org: string,
    transact: true
): AddNodeTransaction;
export function addNode(
    nodeId: string,
    parentId: string,
    data: any,
    org: string,
    transact?: false
): Promise<PutItemCommandOutput>;
export function addNode(
    nodeId: string,
    parentId: string,
    data: any,
    org: string,
    transact?: boolean
): Promise<PutItemCommandOutput> | AddNodeTransaction {
    const params: PutItemCommandInput = {
        TableName: config.tables.treeTable,
        Item: marshall({
            PK: parentId,
            SK: nodeId,
            data,
            org,
        }),
    };

    if (transact) return { Put: params };

    const putItem = new PutItemCommand(params);

    return dynamoDb.send(putItem);
}
