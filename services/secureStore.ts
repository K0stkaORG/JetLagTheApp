import * as SecureStorePackage from "expo-secure-store";

import { Platform } from "react-native";

const get = async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            throw new Error("Error retrieving from localStorage: " + error);
        }
    }

    try {
        return await SecureStorePackage.getItemAsync(key);
    } catch (error) {
        throw new Error("Error retrieving from secure store: " + error);
    }
};

const set = async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
        try {
            window.localStorage.setItem(key, value);
            return;
        } catch (error) {
            throw new Error("Error saving to localStorage: " + error);
        }
    }

    try {
        await SecureStorePackage.setItemAsync(key, value);
    } catch (error) {
        throw new Error("Error saving to secure store: " + error);
    }
};

const remove = async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
        try {
            window.localStorage.removeItem(key);
            return;
        } catch (error) {
            throw new Error("Error removing from localStorage: " + error);
        }
    }

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
