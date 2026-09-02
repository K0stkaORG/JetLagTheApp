import { Patch } from "immer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const assertNever = (value: never): never => {
	throw new Error(`Unexpected value: ${value}`);
};
