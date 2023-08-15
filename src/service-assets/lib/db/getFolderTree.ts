import * as A from 'fp-ts/Array';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { getSubFolders, getSubFoldersAsync } from './getSubFolders';

export interface IFolderTreeItem {
    id: string;
    name: string;
    order: number;
    children: IFolderTreeItem[];
    parent: string | null;
}

export function getFolderTree(
    parentId = 'ROOT',
    orgId: string
): TE.TaskEither<Error, IFolderTreeItem> {
    return pipe(
        getSubFolders(parentId, orgId),
        TE.map((subFolders) => {
            return subFolders.sort((a, b) => {
                if (a.order === undefined || a.order === null) {
                    return 1;
                } else if (b.order === undefined || b.order === null) {
                    return -1;
                } else {
                    return a.order - b.order;
                }
            });
        }),
        TE.chain((subFolders) => {
            return pipe(
                subFolders,
                A.traverse(TE.ApplicativeSeq)((subFolder) =>
                    pipe(
                        getFolderTree(subFolder.id, orgId),
                        TE.map((folder: any) => {
                            return {
                                id: subFolder.id,
                                name: subFolder.name,
                                children: folder.children,
                                order: subFolder.order ?? -1,
                                parent: parentId,
                            };
                        })
                    )
                ),
                TE.map((children) => ({
                    id: parentId,
                    name: '',
                    order: 0,
                    parent: null,
                    children,
                }))
            );
        })
    );
}

export async function getFolderTreeAsync(
    parentId = 'ROOT',
    orgId: string
): Promise<IFolderTreeItem> {
    const subFolders = await getSubFoldersAsync(parentId, orgId);

    const sorted = subFolders.sort((a, b) => {
        if (a.order === undefined || a.order === null) {
            return 1;
        } else if (b.order === undefined || b.order === null) {
            return -1;
        } else {
            return a.order - b.order;
        }
    });

    const children: IFolderTreeItem[] = [];
    for (const item of sorted) {
        const itemTree = await getFolderTreeAsync(item.id, orgId);
        children.push({
            ...item,
            ...itemTree,
            parent: parentId,
        });
    }

    return {
        id: parentId,
        name: '',
        order: 0,
        parent: null,
        children,
    };
}
