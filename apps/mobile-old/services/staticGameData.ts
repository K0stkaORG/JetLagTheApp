import { useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "~/types/models/card";
import { IdMap } from "~/types/models";
import { PersistentCache } from "./cache";
import { Question } from "~/types/models/question";
import { toast } from "sonner-native";

class NoDataError<T> extends Error {
    constructor(
        message: string,
        public readonly data: T
    ) {
        super(message);
    }
}

class PartialDataError<T> extends Error {
    constructor(
        message: string,
        public readonly data: T[]
    ) {
        super(message);
    }
}

class StaticGameDataService<T extends { id: number }> {
    private readonly data: IdMap<T> = new Map();

    public constructor(
        private readonly serverPath: string,
        private readonly cacheNamespace: string,
        private readonly failedToLoad: Omit<T, "id">
    ) {}

    private getFailedToLoad = (id: number): T => ({ ...this.failedToLoad, id }) as T;

    public async get(id: number): Promise<T> {
        // 1. Cache

        if (this.data.has(id)) return this.data.get(id)!;

        // 2. Persistent cache

        const cacheData = await PersistentCache.get<T>(this.cacheNamespace, id);

        if (cacheData) {
            this.data.set(cacheData.id, cacheData);

            return cacheData;
        }

        // 3. Server

        //TODO: Fetch data from server

        throw new NoDataError(
            `Data pro prvek s id ${id} nemohla být načtena.`,
            this.getFailedToLoad(id)
        );
    }

    public async getBatch(ids: [number, ...number[]]): Promise<T[]> {
        // 1. Cache

        const found: Map<number, T> = new Map();
        const cacheMissing: number[] = [];

        for (const id of ids) {
            if (this.data.has(id)) found.set(id, this.data.get(id)!);
            else cacheMissing.push(id);
        }

        // 2. Persistent cache

        let cacheData: { data: T[]; missing: string[] } = { data: [], missing: [] };
        if (cacheMissing.length > 0) {
            cacheData = await PersistentCache.batchGet<T>(this.cacheNamespace, cacheMissing);

            cacheData.data.forEach((value) => {
                this.data.set(value.id, value);
                found.set(value.id, value);
            });
        }

        // 3. Server (not implemented, fallback to failedToLoad)

        if (cacheData.missing.length > 0) {
            // TODO: Fetch data from server

            const serverMissing = cacheData.missing.map((key) => parseInt(key, 10));
            serverMissing.forEach((id) => {
                found.set(id, this.getFailedToLoad(id));
            });

            // Return in requested order, but throw PartialDataError
            const ordered = ids.map((id) => found.get(id)!);
            throw new PartialDataError(
                `Data pro prvky s id ${cacheData.missing.join(", ")} nemohla být načtena.`,
                ordered
            );
        }

        // Return in requested order
        return ids.map((id) => found.get(id)!);
    }
}

const staticGameDataWrapper = <T extends { id: number }>(dataset: StaticGameDataService<T>) => {
    const get = useCallback(
        (id: number) => {
            const [data, setData] = useState<T | null>(null);
            const [isLoading, setIsLoading] = useState(id !== null);

            useEffect(() => {
                setData(null);
                setIsLoading(true);
                let isMounted = true;

                dataset
                    .get(id)
                    .then((fetchedData) => {
                        if (isMounted) setData(fetchedData);
                    })
                    .catch((error) => {
                        if (isMounted) {
                            if (error instanceof NoDataError) {
                                toast.error(error.message);
                                setData(error.data);
                            } else {
                                toast.error(`Při načítání dat pro prvek s id ${id} došlo k chybě`, {
                                    description: error.message,
                                });
                                setData(null);
                            }
                        }
                    })
                    .finally(() => {
                        if (isMounted) setIsLoading(false);
                    });

                return () => {
                    isMounted = false;
                };
            }, [id, dataset]);

            return {
                data,
                isLoading,
            };
        },
        [dataset]
    );

    const getBatch = useCallback(
        (ids: number[]) => {
            const [data, setData] = useState<T[]>([]);
            const [isLoading, setIsLoading] = useState(true);

            const stableIdsKey = useMemo(() => ids.join(":"), [ids]);

            useEffect(() => {
                setData([]);
                setIsLoading(true);
                let isMounted = true;

                dataset
                    .getBatch(ids as [number, ...number[]])
                    .then((fetchedData) => {
                        if (isMounted) setData(fetchedData);
                    })
                    .catch((error) => {
                        if (isMounted) {
                            if (error instanceof PartialDataError) {
                                toast.error(error.message);
                                setData(error.data);
                            } else {
                                toast.error(
                                    `Při načítání dát pro prvky s id ${stableIdsKey} došlo k chybě`,
                                    {
                                        description: error.message,
                                    }
                                );
                                setData([]);
                            }
                        }
                    })
                    .finally(() => {
                        if (isMounted) setIsLoading(false);
                    });

                return () => {
                    isMounted = false;
                };
            }, [stableIdsKey, dataset]);

            return {
                data,
                isLoading,
            };
        },
        [dataset]
    );

    return {
        get,
        getBatch,
    };
};

const questions = new StaticGameDataService<Question>("/questions", "question", {
    name: "Chyba",
    description: "Otázka nemohla být načtena.",
    type: "error",
    price_draw: 0,
    price_keep: 0,
});

const cards = new StaticGameDataService<Card>("/cards", "card", {
    name: "Chyba",
    description: "Karta nemohla být načtena.",
    type: "error",
    data: null,
});

export const useQuestions = () => staticGameDataWrapper(questions);
export const useCards = () => staticGameDataWrapper(cards);

export const preloadStaticGameData = {
    questions: async (ids: number[]) => {
        if (ids.length === 0) return;

        await questions.getBatch(ids as [number, ...number[]]);
    },
    cards: async (ids: number[]) => {
        if (ids.length === 0) return;

        await cards.getBatch(ids as [number, ...number[]]);
    },
};
