import { useGetVideosQuery } from "@/store/youtubeApi";
import { loadCache, saveCache } from "@/utils/cache";
import { useEffect, useState } from "react";

export const useVideoSermons = () => {
  const { data, isLoading, isError, refetch } = useGetVideosQuery({
    maxResults: 15,
  });
  const [videoCache, setVideoCache] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const cached = await loadCache<any[]>("videoSermons", []);
      if (cached.length) {
        setVideoCache(cached);
        return;
      }
      if (data?.items?.length) {
        setVideoCache(data.items);
        saveCache("videoSermons", data.items);
      }
    })();
  }, [data]);

  return { videoCache, isLoading, isError, refetch };
};
