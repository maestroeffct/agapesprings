// utils/prefetchDevotionals.ts
import { Devotional } from "@/api/devotional";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const CACHE_KEY = "devotionalCache";

// 🔹 helper to download image & return local path
async function downloadImage(
  url: string,
  id: number,
  idx: number
): Promise<string> {
  try {
    const fileUri =
      FileSystem.documentDirectory + `devotional-${id}-${idx}.jpg`;
    const { uri } = await FileSystem.downloadAsync(url, fileUri);
    return uri;
  } catch (err) {
    console.warn("Failed to cache image:", url, err);
    return url; // fallback to online
  }
}

// 🔹 save devotionals + cache their images
export async function saveDevotionalCache(devotionals: Devotional[]) {
  const cached: Devotional[] = [];

  for (const devo of devotionals) {
    const newDevo = { ...devo };

    // cache header
    if (devo.headerUrl) {
      newDevo.headerUrl = await downloadImage(devo.headerUrl, devo.id, 0);
    }

    // cache content
    if (devo.content?.length) {
      newDevo.content = await Promise.all(
        devo.content.map((url, i) => downloadImage(url, devo.id, i + 1))
      );
    }

    cached.push(newDevo);
  }

  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
}

// 🔹 load cached devotionals
export async function loadDevotionalCache(): Promise<Devotional[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load cached devotionals:", err);
    return [];
  }
}
