// hooks/useTestimonies.ts
import { useGetTestimonyVideosQuery } from "@/store/youtubeApi";
import { useEffect, useState } from "react";

export function useTestimonies() {
  const { data, error, isLoading, refetch } = useGetTestimonyVideosQuery({
    maxResults: 25,
  });

  const [videoCache, setVideoCache] = useState<any[]>([]);

  useEffect(() => {
    if (data?.items) {
      setVideoCache(data.items);
    }
  }, [data]);

  return {
    testimonyCache: videoCache,
    isLoading,
    isError: !!error,
    reload: refetch,
  };
}
