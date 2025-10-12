// utils/prefetchWebPages.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const urls = {
  about: "https://www.agapespringsint.com/about",
  give: "https://www.agapespringsint.com/giving",
  // you can add devotionals, contact, etc.
};

export async function prefetchWebPages() {
  for (const [key, url] of Object.entries(urls)) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      await AsyncStorage.setItem(`page-cache-${key}`, html);
    } catch (e) {
      console.warn(`❌ Failed to prefetch ${url}`, e);
    }
  }
}

export async function getCachedPage(key: keyof typeof urls) {
  return await AsyncStorage.getItem(`page-cache-${key}`);
}
