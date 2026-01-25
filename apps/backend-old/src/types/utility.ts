export type IdMap<T extends { id: number }> = Map<T["id"], T>;
