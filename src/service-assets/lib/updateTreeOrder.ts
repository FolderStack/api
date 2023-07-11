import { UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '@common/utils';
import { getFolderAsync } from './db';
import { IFolderTreeItem } from './db/getFolderTree';
import { updateFolderAsync } from './db/updateFolder';
import { updateFolderParentAsync } from './db/updateFolderParent';

interface IdTree {
    id: string;
    children: IdTree[];
}

// Helper function to flatten the tree
// const flattenTree = (node: IdTree): string[] => {
//     let arr = [node.id];
//     for (let child of node.children || []) {
//         arr = arr.concat(flattenTree(child));
//     }
//     return arr;
// };

// // Helper function to find the parent of a node in the tree
// function findParent(tree: IdTree[], nodeId: string): string | undefined {
//     for (const node of tree) {
//         if (node.children.some((child) => child.id === nodeId)) {
//             return node.id;
//         }
//         const foundParentId = findParent(node.children, nodeId);
//         if (foundParentId) return foundParentId;
//     }
//     return undefined;
// }

// export function updateTreeOrder(
//     tree: IdTree[],
//     org: string,
//     parentId: string,
//     returnCommands: true,
//     updateCommands?: TE.TaskEither<Error, UpdateTransactionItem[]>[]
// ): TE.TaskEither<Error, UpdateTransactionItem[]>;
// export function updateTreeOrder(
//     tree: IdTree[],
//     org: string,
//     parentId?: string,
//     returnCommands?: undefined | false,
//     updateCommands?: TE.TaskEither<Error, UpdateTransactionItem[]>[]
// ): TE.TaskEither<Error, void>;
// export function updateTreeOrder(
//     tree: IdTree[],
//     org: string,
//     parentId = 'ROOT',
//     returnCommands = false,
//     updateCommands: TE.TaskEither<Error, UpdateTransactionItem[]>[] = []
// ) {
//     return pipe(
//         getFolderTree(parentId, org),
//         TE.chain((root) => {
//             for (let idx = 0; idx < tree.length; idx++) {
//                 const node = tree[idx];
//                 const oldFolder = root.children.find(
//                     (folder) => folder.id === node.id
//                 );
//                 console.log('looking for folder', node.id, oldFolder);
//                 if (oldFolder) {
//                     // generate update task for the current node
//                     const updateCurrentFolder =
//                         oldFolder.parent !== parentId
//                             ? updateFolderParent(
//                                   oldFolder.id,
//                                   parentId,
//                                   oldFolder?.parent ?? 'ROOT',
//                                   fromJsonToFolderRecord({
//                                       ...oldFolder,
//                                       order: idx,
//                                   }),
//                                   true
//                               )
//                             : updateFolder(
//                                   oldFolder.id,
//                                   { order: idx },
//                                   org,
//                                   true
//                               );

//                     updateCommands.push(updateCurrentFolder as any);

//                     // recursively generate update tasks for children
//                     if (node.children.length > 0) {
//                         updateTreeOrder(
//                             node.children,
//                             org,
//                             node.id,
//                             true,
//                             updateCommands
//                         );
//                     }
//                 }
//             }
//             return TE.right(updateCommands);
//         }),
//         TE.chain((commands) => {
//             const items = commands
//                 .flat()
//                 .filter((v) => typeof v === 'object' && 'Update' in v);
//             if (returnCommands) {
//                 console.log(
//                     'returning commands',
//                     JSON.stringify(items, null, 4)
//                 );
//                 return TE.right(items);
//             }
//             console.log(JSON.stringify(items, null, 4));
//             return sendBatchWriteCommand(items) as any;
//         })
//     );
// }

async function updateTreeOrderRecurseAsync(
    tree: IFolderTreeItem[],
    orgId: string,
    parentId = 'ROOT'
): Promise<UpdateItemCommandInput[]> {
    let updateCommands: any[] = [];

    console.log(tree.map((t) => [t.id, t.order]));

    for (let i = 0; i < tree.length; i++) {
        const node = tree[i];

        const currentNode = await getFolderAsync(node.id, orgId);

        const previousOrder = currentNode.order;
        currentNode.order = i;

        const oldParentId = currentNode.parent ?? 'ROOT';

        let transactions: any[] = [];
        try {
            transactions = updateFolderParentAsync(
                node.id,
                parentId,
                oldParentId,
                currentNode,
                orgId,
                true
            ).TransactItems;
        } catch (err) {
            console.log(err);
        }

        updateCommands = updateCommands.concat(transactions);

        if (!transactions?.length) {
            // same folder & parent
            if (i !== previousOrder) {
                const updateCommand = await updateFolderAsync(
                    node.id,
                    { order: i },
                    orgId,
                    true,
                    currentNode
                );
                updateCommands.push(updateCommand);
            }
        }

        // Recursively generate update transactions for children
        if (node.children && node.children.length > 0) {
            const childCommands = await updateTreeOrderRecurseAsync(
                node.children,
                orgId,
                node.id
            );
            updateCommands = updateCommands.concat(childCommands);
        }
    }

    return updateCommands;
}

export async function updateTreeOrderAsync(
    newItems: IFolderTreeItem[],
    org: string
) {
    try {
        const items = await updateTreeOrderRecurseAsync(newItems, org);
        console.log(
            JSON.stringify(
                items.filter((i) => !!i),
                null,
                4
            )
        );
        const command = new TransactWriteCommand({
            TransactItems: items.filter((i) => !!i),
        });

        await dynamoDb.send(command as any);
    } catch (err) {
        console.log(err);
    }
}
