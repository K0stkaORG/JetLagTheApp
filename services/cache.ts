import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersistentStorage } from "./persistentStorage";

const get = async <T>(key: string): Promise<T | null> => {
    const value = await PersistentStorage.get(key);
    return value ? JSON.parse(value) : null;
};

const batchGet = async <T>(
    keys: string[]
): Promise<{
    data: T[];
    missing: string[];
}> => {
    const values = await AsyncStorage.multiGet(keys); // Using AsyncStorage directly instead of PersistentStorage to avoid unnecessary conversion

    const missing: string[] = [];
    const data: T[] = values
        .filter(([key, value]) => {
            if (value !== null) return true;

            missing.push(key);
            return false;
        })
        .map(([_key, value]) => JSON.parse(value!));

    return {
        data,
        missing,
    };
};

const set = async <T>(key: string, value: T): Promise<void> =>
    await PersistentStorage.set(key, JSON.stringify(value));

const batchSet = async <T>(entries: Record<string, T>): Promise<void> =>
    // Using AsyncStorage directly instead of PersistentStorage to avoid unnecessary conversion
    AsyncStorage.multiSet(
        Object.entries(entries).map(([key, value]) => [key, JSON.stringify(value)])
    );

const purge = async (): Promise<void> => await PersistentStorage.removeAll();

export const PersistentCache = {
    get,
    batchGet,
    set,
    batchSet,
    purge,
};
