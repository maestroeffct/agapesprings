import { getAudioSermons } from "@/api/audio";
import { loadCache, saveCache } from "@/utils/cache";
import { useEffect, useState } from "react";

export const useAudioSermons = () => {
  const [audio, setAudio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAudio = async (force = false) => {
    const cached = await loadCache<any[]>("audioSermons", []);
    if (cached.length && !force) {
      setAudio(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const rows = await getAudioSermons(1, 10);
      if (rows?.length) {
        setAudio(rows);
        saveCache("audioSermons", rows);
      }
    } catch (err: any) {
      console.warn("getAudioSermons failed:", err?.message || err);
      setError("Failed to load audio sermons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudio();
  }, []);

  return { audio, loading, error, reload: () => loadAudio(true) };
};
