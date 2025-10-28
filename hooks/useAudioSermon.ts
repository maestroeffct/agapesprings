// hooks/useAudioSermon.ts
import { getAudioSermons } from "@/api/audio";
import { loadCache, saveCache } from "@/utils/cache";
import { useEffect, useState } from "react";

export const useAudioSermons = (options?: {
  limit?: number;
  fetchAll?: boolean;
}) => {
  const [audio, setAudio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = options?.limit;
  const fetchAll = options?.fetchAll ?? false;

  const loadAudio = async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      const cached = await loadCache<any[]>("audioSermons", []);
      const cacheTooSmall = limit && cached.length < limit;
      const shouldRefetch = force || !cached.length || cacheTooSmall;

      // ✅ Use cache if it’s large enough
      if (!shouldRefetch) {
        setAudio(limit ? cached.slice(0, limit) : cached);
        setLoading(false);
        return;
      }

      // ✅ Otherwise, fetch from API
      let allRows: any[] = [];
      let page = 1;
      const size = 50;
      let keepGoing = true;

      while (keepGoing) {
        const rows = await getAudioSermons(page, size);
        if (!rows?.length) break;
        allRows = [...allRows, ...rows];
        if (!fetchAll || rows.length < size) keepGoing = false;
        page++;
      }

      if (allRows.length) {
        const final = limit ? allRows.slice(0, limit) : allRows;
        setAudio(final);
        await saveCache("audioSermons", allRows);
      } else {
        setError("No audio sermons found.");
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
  }, [limit, fetchAll]);

  return { audio, loading, error, reload: () => loadAudio(true) };
};
