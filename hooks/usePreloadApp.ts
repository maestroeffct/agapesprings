// src/hooks/usePreloadApp.ts
import { getAudioSermons } from "@/api/audio";
import { getCarousel } from "@/api/carousel";
import { getDevotionals } from "@/api/devotional";
import { getNotifications } from "@/api/notifications";
import { youtubeApi } from "@/store/youtubeApi"; // if RTK Query
import { saveCache } from "@/utils/cache";
import { useEffect } from "react";

export default function usePreloadApp() {
  useEffect(() => {
    async function preload() {
      try {
        // Fire all requests in parallel
        const [audios, carousel, devos, notifs] = await Promise.allSettled([
          getAudioSermons(1, 50),
          getCarousel(),
          getDevotionals(1, 50),
          getNotifications(),
        ]);

        if (audios.status === "fulfilled") {
          saveCache("audioSermons", audios.value);
        }
        if (carousel.status === "fulfilled") {
          saveCache("carousel", carousel.value);
        }
        if (devos.status === "fulfilled") {
          saveCache("devotionals", devos.value.data);
        }
        if (notifs.status === "fulfilled") {
          saveCache("notifications", notifs.value);
        }

        // Trigger YouTube preload via RTK Query
        youtubeApi.endpoints.getVideos.initiate({ maxResults: 50 });
      } catch (e) {
        console.warn("Preload error:", e);
      }
    }

    preload();
  }, []);
}
