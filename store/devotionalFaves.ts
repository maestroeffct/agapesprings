import { Devotional } from "@/api/devotional";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "favedIds";
const FAVED_DATA_KEY = "favedDevotionals";

export async function getFavedIds(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getFavedDevotionals(): Promise<Devotional[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVED_DATA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleFave(
  id: number,
  devo?: Devotional
): Promise<number[]> {
  const ids = await getFavedIds();
  let updated: number[];

  if (ids.includes(id)) {
    updated = ids.filter((x) => x !== id);

    // remove from stored devotionals
    const stored = await getFavedDevotionals();
    const filtered = stored.filter((d) => d.id !== id);
    await AsyncStorage.setItem("favedDevotionals", JSON.stringify(filtered));
  } else {
    updated = [...ids, id];

    if (devo) {
      const stored = await getFavedDevotionals();
      const exists = stored.find((d) => d.id === id);
      if (!exists) {
        stored.push(devo);
        await AsyncStorage.setItem("favedDevotionals", JSON.stringify(stored));
      }
    }
  }

  await AsyncStorage.setItem("favedIds", JSON.stringify(updated));
  return updated;
}
