import { getCarousel } from "@/api/carousel";
import { loadCache, saveCache } from "@/utils/cache";
import { Image as ExpoImage } from "expo-image";
import { useEffect, useState } from "react";

const localCarousel = [
  { id: "local-0", image: require("@/assets/images/flow.jpg") },
  { id: "local-1", image: require("@/assets/images/flow1.png") },
];

export const useCarousel = () => {
  const [displayData, setDisplayData] = useState<any[]>(localCarousel);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCarousel = async (force = false) => {
    try {
      const cached = await loadCache<any[]>("carousel", []);
      if (cached.length && !force) {
        setDisplayData(cached);
        setLoading(false);
        return;
      }

      const remote = (await getCarousel()) || [];
      if (remote.length) {
        const urls = remote.map((r) => r.url).filter(Boolean);
        await Promise.all(urls.map((u) => ExpoImage.prefetch(u)));
        setDisplayData(remote);
        saveCache("carousel", remote);
      } else {
        setDisplayData(localCarousel);
      }
    } catch (e: any) {
      console.warn("Carousel fetch failed:", e);
      setError("Failed to load carousel");
      setDisplayData(localCarousel);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCarousel();
  }, []);

  return { displayData, loading, error, reload: () => loadCarousel(true) };
};
