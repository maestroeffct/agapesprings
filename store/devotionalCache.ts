// store/devotionalCache.ts
import { Devotional } from "@/api/devotional";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVO_CACHE_KEY = "cachedDevotionals";

export async function getCachedDevotionals(): Promise<Devotional[]> {
  try {
    const raw = await AsyncStorage.getItem(DEVO_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveDevotionalToCache(devo: Devotional) {
  const cache = await getCachedDevotionals();

  const exists = cache.find((d) => d.id === devo.id);
  let updated;
  if (exists) {
    updated = cache.map((d) => (d.id === devo.id ? devo : d));
  } else {
    updated = [...cache, devo];
  }

  await AsyncStorage.setItem(DEVO_CACHE_KEY, JSON.stringify(updated));
}
