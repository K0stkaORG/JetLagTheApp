import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER: "user_data",
  API_BASE_URL: "api_base_url",
  SOCKET_URL: "socket_url",
} as const;

export async function loadJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write errors
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
    }
  } catch {
    // ignore errors
  }
}

export async function getUser(): Promise<unknown | null> {
  return loadJson(STORAGE_KEYS.USER);
}

export async function setUser<T>(user: T | null): Promise<void> {
  await saveJson(STORAGE_KEYS.USER, user);
}

export async function getApiBaseUrl(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.API_BASE_URL);
}

export async function setApiBaseUrl(url: string | null): Promise<void> {
  if (url) {
    await AsyncStorage.setItem(STORAGE_KEYS.API_BASE_URL, url);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.API_BASE_URL);
  }
}

export async function getSocketUrl(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.SOCKET_URL);
}

export async function setSocketUrl(url: string | null): Promise<void> {
  if (url) {
    await AsyncStorage.setItem(STORAGE_KEYS.SOCKET_URL, url);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.SOCKET_URL);
  }
}
