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
        public readonly data: Record<number, T>
    ) {
        super(message);
    }
}

class DatasetHandler<T extends { id: number }> {
    private readonly data: IdMap<T> = new Map();

    public constructor(
        private readonly serverPath: string,
        private readonly cacheKeyPrefix: string,
        private readonly failedToLoad: T
    ) {}

    public async get(id: number): Promise<T> {
        // 1. Cache

        if (this.data.has(id)) return this.data.get(id)!;

        // 2. Persistent cache

        const cacheData = await PersistentCache.get<T>(`${this.cacheKeyPrefix}${id}`);

        if (cacheData) {
            this.data.set(cacheData.id, cacheData);

            return cacheData;
        }

        // 3. Server

        //TODO: Fetch data from server

        throw new NoDataError(`Data pro prvek s id ${id} nemohla být načtena.`, this.failedToLoad);
    }

    public async getBatch(ids: [number, ...number[]]): Promise<Record<number, T>> {
        // 1. Cache

        const missing: string[] = [];
        const data: Record<number, T> = {};

        for (const id of ids) {
            if (this.data.has(id)) data[id] = this.data.get(id)!;
            else missing.push(`${this.cacheKeyPrefix}${id}`);
        }

        if (missing.length === 0) return data;

        // 2. Persistent cache

        const cacheData = await PersistentCache.batchGet<T>(missing);

        cacheData.data.forEach((value) => {
            this.data.set(value.id, value);
            data[value.id] = value;
        });

        if (cacheData.missing.length === 0) return data;

        // 3. Server

        //TODO: Fetch data from server

        const serverMissing = cacheData.missing.map((key) =>
            parseInt(key.substring(this.cacheKeyPrefix.length), 10)
        );

        serverMissing.forEach((id) => {
            data[id] = this.failedToLoad;
        });

        throw new PartialDataError(
            `Data pro prvky s id ${cacheData.missing.join(", ")} nemohla být načtena.`,
            data
        );
    }
}

const datasetHandlerWrapper = <T extends { id: number }>(dataset: DatasetHandler<T>) => {
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
        (ids: [number, ...number[]]) => {
            const [data, setData] = useState<Record<number, T>>({});
            const [isLoading, setIsLoading] = useState(true);

            const stableIdsKey = useMemo(
                () => JSON.stringify([...ids].sort((a, b) => a - b)),
                [ids]
            );

            useEffect(() => {
                setData({});
                setIsLoading(true);
                let isMounted = true;

                dataset
                    .getBatch(ids)
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
                                setData({});
                            }
                        }
                    })
                    .finally(() => {
                        if (isMounted) setIsLoading(false);
                    });

                return () => {
                    isMounted = false;
                };
            }, [stableIdsKey, dataset, ids]);

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

const Dataset = {
    questions: datasetHandlerWrapper(
        new DatasetHandler<Question>("/questions", "question_", {
            id: -1,
            name: "Chyba",
            description: "Otázka nemohla být načtena.",
            type: "error",
            price_draw: 0,
            price_keep: 0,
        })
    ),
    cards: datasetHandlerWrapper(
        new DatasetHandler<Card>("/cards", "card_", {
            id: -1,
            name: "Chyba",
            description: "Karta nemohla být načtena.",
            type: "error",
            data: null,
        })
    ),
};

export const useDataset = () => Dataset;
