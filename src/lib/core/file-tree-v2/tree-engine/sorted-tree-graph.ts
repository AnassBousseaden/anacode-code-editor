export interface ITreeGraph<T, ID> {
	getRoot(): ID;

	getChildren(id: ID): ReadonlyArray<ID>;

	getParent(id: ID): ID | null;

	getNode(id: ID): T | null;
}
