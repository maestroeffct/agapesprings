// utils/devotionalDownloads.ts
import * as FileSystem from "expo-file-system";

const DOWNLOADS_FILE = FileSystem.documentDirectory + "downloads.json";

export type DownloadedDevotional = {
  id: number;
  images: string[]; // file URIs
  timestamp: number;
};

export async function getDownloadedDevotionals(): Promise<
  DownloadedDevotional[]
> {
  try {
    const raw = await FileSystem.readAsStringAsync(DOWNLOADS_FILE);
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveDownloadedDevotional(dev: DownloadedDevotional) {
  const all = await getDownloadedDevotionals();
  const existingIndex = all.findIndex((d) => d.id === dev.id);
  if (existingIndex !== -1) all.splice(existingIndex, 1);
  all.unshift(dev); // latest first
  await FileSystem.writeAsStringAsync(DOWNLOADS_FILE, JSON.stringify(all));
}
