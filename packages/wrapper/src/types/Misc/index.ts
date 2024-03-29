export type If<T extends boolean, A, B = null> = T extends true ? A : T extends false ? B : A | B;

export interface WorkerData {
	op: number;
}
