// utils/imageCache.ts
import * as FileSystem from "expo-file-system";

/**
 * Downloads an image to the local cache directory and returns the local URI.
 * Reuses existing file if already downloaded.
 */
export async function cacheImage(
  url: string,
  keyPrefix = "img_"
): Promise<string> {
  if (!url) return "";

  try {
    const fileName =
      keyPrefix + encodeURIComponent(url).replace(/[^a-z0-9]/gi, "_");
    const fileUri = `${FileSystem.cacheDirectory}${fileName}.jpg`;

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return fileUri; // ✅ already cached
    }

    const download = await FileSystem.downloadAsync(url, fileUri);
    return download.uri;
  } catch (err) {
    console.warn("cacheImage failed:", err);
    return url; // fallback to remote URL
  }
}

/**
 * Replaces specified keys in each object with cached image URIs.
 * Ensures type safety and avoids symbol / mutation errors.
 */
export async function cacheImageList<T extends Record<string | number, any>>(
  items: T[],
  keys: readonly (string | number)[]
): Promise<T[]> {
  const newItems = await Promise.all(
    items.map(async (item) => {
      // copy item first
      const updated = { ...item };

      for (const key of keys) {
        const val = item[key as keyof T]; // ✅ safely read generic key
        if (typeof val === "string" && val.startsWith("http")) {
          (updated as any)[key] = await cacheImage(val);
        }
      }

      return updated as T;
    })
  );

  return newItems;
}
