export const all = async <T extends readonly unknown[]>(
	promises: [...{ [K in keyof T]: Promise<T[K]> }],
): Promise<{ -readonly [K in keyof T]: T[K] }> => {
	const results = await Promise.allSettled(promises);

	for (const result of results) if (result.status === "rejected") throw result.reason;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return results.map((result) => (result as PromiseFulfilledResult<unknown>).value) as any;
};
