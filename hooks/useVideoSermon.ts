// hooks/useVideoSermons.ts
import { useGetVideosQuery } from "@/store/youtubeApi";
import { loadCache, saveCache } from "@/utils/cache";
import { useCallback, useEffect, useState } from "react";

export const useVideoSermons = () => {
  // Base RTK query
  const { data, isLoading, isError, refetch } = useGetVideosQuery({
    maxResults: 15,
  });

  // Local state
  const [videoCache, setVideoCache] = useState<any[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 🔹 Load from cache first, then API
  useEffect(() => {
    (async () => {
      const cached = await loadCache<any[]>("videoSermons", []);
      if (cached.length) setVideoCache(cached);

      if (data?.items?.length) {
        setVideoCache(data.items);
        saveCache("videoSermons", data.items);
        setNextPageToken(data.nextPageToken || null);
        setHasMore(!!data.nextPageToken);
      }
    })();
  }, [data]);

  // 🔹 Load next page manually (pagination)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextPageToken) return;
    try {
      setLoadingMore(true);

      const url = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=15&playlistId=UUBWp1EIoJNEe4ggBArv84ng&pageToken=${nextPageToken}&key=AIzaSyBxHACG4JGurUzoHPSLQgUv0NZTj-k-VQQ`;

      const res = await fetch(url);
      const json = await res.json();

      if (json?.items?.length) {
        setVideoCache((prev) => {
          const merged = [...prev, ...json.items];
          saveCache("videoSermons", merged);
          return merged;
        });

        setNextPageToken(json.nextPageToken || null);
        setHasMore(!!json.nextPageToken);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("❌ Failed to load more videos:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nextPageToken]);

  // 🔹 Refetch all from start
  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    videoCache,
    isLoading,
    isError,
    reload,
    loadMore,
    loadingMore,
    hasMore,
  };
};
