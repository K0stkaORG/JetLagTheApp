import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersistentStorage } from "./persistentStorage";

const get = async <T>(namespace: string, key: string | number): Promise<T | null> => {
    const value = await PersistentStorage.get(`${namespace}:${key}`);
    return value ? JSON.parse(value) : null;
};

const batchGet = async <T>(
    namespace: string,
    keys: (string | number)[]
): Promise<{
    data: T[];
    missing: string[];
}> => {
    const values = await AsyncStorage.multiGet(keys.map((key) => `${namespace}:${key}`)); // Using AsyncStorage directly instead of PersistentStorage to avoid unnecessary conversion

    const missing: string[] = [];
    const data: T[] = values
        .filter(([key, value]) => {
            if (value !== null) return true;

            missing.push(key.substring(namespace.length + 1));
            return false;
        })
        .map(([_key, value]) => JSON.parse(value!));

    return {
        data,
        missing,
    };
};

const set = async <T>(namespace: string, key: string | number, value: T): Promise<void> =>
    await PersistentStorage.set(`${namespace}:${key}`, JSON.stringify(value));

const batchSet = async <T>(namespace: string, entries: Record<string | number, T>): Promise<void> =>
    // Using AsyncStorage directly instead of PersistentStorage to avoid unnecessary conversion
    AsyncStorage.multiSet(
        Object.entries(entries).map(([key, value]) => [
            `${namespace}:${key}`,
            JSON.stringify(value),
        ])
    );

const purge = async (): Promise<void> => await PersistentStorage.removeAll();

export const PersistentCache = {
    get,
    batchGet,
    set,
    batchSet,
    purge,
};
