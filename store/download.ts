import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type DownloadItem = {
  id: string | number;
  title: string;
  author?: string;
  thumb?: any;
  type: "audio" | "video";
  size?: string;
  localPath?: string;
  progress?: number;
  status?: "queued" | "downloading" | "completed" | "failed" | "paused";
  url?: string; // ✅ keep source URL
};

type DownloadsState = {
  downloads: Record<string, DownloadItem>;
  queue: string[]; // ids waiting to download
  downloadingId?: string; // currently active
  enqueueDownload: (item: DownloadItem, url: string) => void;
  pauseDownload: (id: string | number) => void;
  resumeDownload: (id: string | number) => void;
  removeDownload: (id: string | number) => Promise<void>;
  isDownloaded: (id: string | number) => boolean;
  getProgress: (id: string | number) => number;
};

let resumables: Record<string, FileSystem.DownloadResumable> = {};

export const useDownloads = create<DownloadsState>()(
  persist(
    (set, get) => ({
      downloads: {},
      queue: [],
      downloadingId: undefined,

      enqueueDownload: (item, url) => {
        const key = String(item.id);

        set((s) => ({
          downloads: {
            ...s.downloads,
            [key]: {
              ...item,
              progress: 0,
              status: "queued",
              url,
            },
          },
          queue: [...s.queue, key],
        }));

        processQueue();
      },

      pauseDownload: (id) => {
        const key = String(id);
        const res = resumables[key];
        if (res) {
          res.pauseAsync().catch(() => {});
          set((s) => ({
            downloads: {
              ...s.downloads,
              [key]: { ...s.downloads[key], status: "paused" },
            },
          }));
        }
      },

      resumeDownload: (id) => {
        const key = String(id);
        const res = resumables[key];
        if (res) {
          res.resumeAsync().catch(() => {});
          set((s) => ({
            downloads: {
              ...s.downloads,
              [key]: { ...s.downloads[key], status: "downloading" },
            },
          }));
        }
      },

      removeDownload: async (id) => {
        const key = String(id);
        const existing = get().downloads[key];
        if (existing?.localPath) {
          try {
            await FileSystem.deleteAsync(existing.localPath, {
              idempotent: true,
            });
          } catch (e) {
            console.warn("Failed to delete file:", e);
          }
        }
        set((s) => {
          const copy = { ...s.downloads };
          delete copy[key];
          return { downloads: copy, queue: s.queue.filter((q) => q !== key) };
        });
      },

      isDownloaded: (id) => get().downloads[String(id)]?.status === "completed",
      getProgress: (id) => get().downloads[String(id)]?.progress ?? 0,
    }),
    {
      name: "downloads-store",
      storage: {
        getItem: async (name) => {
          const raw = await AsyncStorage.getItem(name);
          return raw ? JSON.parse(raw) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);

// ✅ Queue processor
async function processQueue() {
  const state = useDownloads.getState();
  if (state.downloadingId || state.queue.length === 0) return;

  const nextId = state.queue[0];
  const item = state.downloads[nextId];
  if (!item || !item.url) return;

  const ext = item.url.endsWith(".mp4") ? ".mp4" : ".mp3";
  const fileUri = `${FileSystem.documentDirectory}${item.id}${ext}`;

  // Create resumable
  const resumable = FileSystem.createDownloadResumable(
    item.url,
    fileUri,
    {},
    (progress) => {
      const ratio =
        progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
      useDownloads.setState((s) => ({
        downloads: {
          ...s.downloads,
          [nextId]: {
            ...s.downloads[nextId],
            progress: ratio,
            status: "downloading",
          },
        },
      }));
    }
  );
  resumables[nextId] = resumable;

  // Mark as active
  useDownloads.setState((s) => ({ downloadingId: nextId }));
  try {
    const result = await resumable.downloadAsync();
    if (result) {
      useDownloads.setState((s) => ({
        downloads: {
          ...s.downloads,
          [nextId]: {
            ...s.downloads[nextId],
            localPath: result.uri, // ✅ safe now
            progress: 1,
            status: "completed",
          },
        },
        queue: s.queue.filter((q) => q !== nextId),
        downloadingId: undefined,
      }));
    }
  } catch (err) {
    console.error("Download failed:", err);
    useDownloads.setState((s) => ({
      downloads: {
        ...s.downloads,
        [nextId]: { ...s.downloads[nextId], status: "failed" },
      },
      queue: s.queue.filter((q) => q !== nextId),
      downloadingId: undefined,
    }));
  }
}
