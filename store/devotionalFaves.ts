// store/devotionalFaves.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "faved_devotionals";

export async function getFavedIds(): Promise<number[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function toggleFave(id: number): Promise<number[]> {
  const current = await getFavedIds();
  let updated: number[];

  if (current.includes(id)) {
    updated = current.filter((x) => x !== id); // remove
  } else {
    updated = [...current, id]; // add
  }

  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export async function clearFaves() {
  await AsyncStorage.removeItem(KEY);
}
