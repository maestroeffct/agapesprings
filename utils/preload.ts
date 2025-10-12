// utils/preload.ts
import { getAudioSermons } from "@/api/audio";
import { getCarousel } from "@/api/carousel";
import { getCategories } from "@/api/categories";
import { getDevotionals } from "@/api/devotional";
import { getNotifications } from "@/api/notifications";
import { DRAWER_LINKS } from "@/constants/links";
import { saveDevotionalToCache } from "@/store/devotionalCache";
import { getFavedDevotionals, getFavedIds } from "@/store/devotionalFaves";
import { saveCache } from "@/utils/cache";
import * as FileSystem from "expo-file-system";

// preload Home Tab data
export async function preloadHome() {
  try {
    // carousel
    const carousel = await getCarousel();
    if (carousel?.length) {
      await saveCache("carousel", carousel);
    }

    // audio
    const audios = await getAudioSermons(1, 5);
    if (audios?.length) {
      await saveCache("audioSermons", audios);
    }

    // videos → YouTube API (do not block UI)
    // Instead of waiting, trigger via redux-query (already cached)
    // let YouTube query cache handle it
  } catch (err) {
    console.warn("preloadHome failed", err);
  }
}

// preload Devotionals
// export async function preloadDevotionals() {
//   try {
//     const res = await getDevotionals(1, 80);
//     if (res?.data?.length) {
//       await saveCache("devotionals", res.data);
//     }
//   } catch (err) {
//     console.warn("preloadDevotionals failed", err);
//   }
// }

// preload Notifications
export async function preloadNotifications() {
  try {
    const res = await getNotifications();
    if (res?.data) {
      await saveCache("notifications", res.data);
    }
  } catch (err) {
    console.warn("preloadNotifications failed", err);
  }
}

// 🔹 preload Livingwaters
export async function preloadLivingwaters() {
  try {
    // 1️⃣ Audio sermons (first page)
    const audios = await getAudioSermons(1, 50);
    if (audios?.length) {
      await saveCache("audioSermonsCache", audios);
    }

    // 2️⃣ Categories
    try {
      const cats = await getCategories?.();
      if (cats?.length) {
        await saveCache("categoriesCache", cats);
      }
    } catch (e) {
      console.warn("preloadLivingwaters categories failed", e);
    }

    // 3️⃣ Videos (YouTube API) – handled by redux-query
    // you don’t need to await here, let store fill cache
  } catch (err) {
    console.warn("preloadLivingwaters failed", err);
  }
}

export async function preloadDevotionals() {
  try {
    // Load first page of devotionals
    const res = await getDevotionals(1, 80);
    if (res?.data?.length) {
      for (const devo of res.data) {
        await saveDevotionalToCache(devo);
      }
    }

    // Preload favourites too (ids + full devotionals)
    await getFavedIds();
    await getFavedDevotionals();
  } catch (err) {
    console.warn("preloadDevotionals failed:", err);
  }
}

async function cacheWebPage(key: string, url: string) {
  try {
    const fileUri = `${FileSystem.cacheDirectory}${key}.html`;
    const res = await fetch(url);
    const html = await res.text();
    await FileSystem.writeAsStringAsync(fileUri, html);
    console.log(`✅ Cached ${key} page`);
    return fileUri;
  } catch (err) {
    console.warn(`Failed to cache ${key}:`, err);
    return url; // fallback to live URL
  }
}

export async function preloadDrawerScreens() {
  return {
    aboutUs: await cacheWebPage("aboutUs", DRAWER_LINKS.aboutUs),
    give: await cacheWebPage("give", DRAWER_LINKS.give),
  };
}
