import AsyncStorage from "@react-native-async-storage/async-storage";

const get = async (key: string): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(key);
    } catch (error) {
        throw new Error("Error retrieving from async storage: " + error);
    }
};

const batchGet = async (keys: string[]): Promise<Record<string, string | null>> => {
    try {
        return Object.fromEntries(await AsyncStorage.multiGet(keys));
    } catch (error) {
        throw new Error("Error retrieving batch from async storage: " + error);
    }
};

const set = async (key: string, value: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (error) {
        throw new Error("Error saving to async storage: " + error);
    }
};

const batchSet = async (items: Record<string, string>): Promise<void> => {
    const entries = Object.entries(items);
    try {
        await AsyncStorage.multiSet(entries);
    } catch (error) {
        throw new Error("Error saving batch to async storage: " + error);
    }
};

const remove = async (key: string): Promise<void> => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        throw new Error("Error removing from async storage: " + error);
    }
};

const removeAll = async (): Promise<void> => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(keys);
    } catch (error) {
        throw new Error("Error removing all from async storage: " + error);
    }
};

export const PersistentStorage = {
    get,
    batchGet,
    set,
    remove,
    batchSet,
    removeAll,
};
