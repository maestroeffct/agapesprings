// utils/cache.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveCache<T>(key: string, data: T) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save cache", key, e);
  }
}

export async function loadCache<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn("Failed to load cache", key, e);
    return fallback;
  }
}
