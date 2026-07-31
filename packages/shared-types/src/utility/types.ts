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

export type DeepReadonly<T> = {
	readonly [K in keyof T]: T[K] extends Function
		? T[K]
		: T[K] extends Map<infer K2, infer V2>
			? ReadonlyMap<DeepReadonly<K2>, DeepReadonly<V2>>
			: T[K] extends Set<infer V3>
				? ReadonlySet<DeepReadonly<V3>>
				: T[K] extends object
					? DeepReadonly<T[K]>
					: T[K];
};
