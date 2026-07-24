import { Patch } from "immer";

export type PathTuple<T> = T extends readonly any[]
	? [number] | [number, ...PathTuple<T[number]>]
	: T extends object
		? {
				[K in keyof T & (string | number)]: T[K] extends object ? [K] | [K, ...PathTuple<T[K]>] : [K];
			}[keyof T & (string | number)]
		: [];

export type TypedPatch<T> = Omit<Patch, "path"> & {
	path: PathTuple<T>;
};
