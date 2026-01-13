import * as SecureStorePackage from "expo-secure-store";

const get = async (key: string): Promise<string | null> => {
    try {
        return await SecureStorePackage.getItemAsync(key);
    } catch (error) {
        throw new Error("Error retrieving from secure store: " + error);
    }
};

const set = async (key: string, value: string): Promise<void> => {
    try {
        await SecureStorePackage.setItemAsync(key, value);
    } catch (error) {
        throw new Error("Error saving to secure store: " + error);
    }
};

const remove = async (key: string): Promise<void> => {
    try {
        await SecureStorePackage.deleteItemAsync(key);
    } catch (error) {
        throw new Error("Error removing from secure store: " + error);
    }
};

export const SecureStore = {
    get,
    set,
    remove,
};
