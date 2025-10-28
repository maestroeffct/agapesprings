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
  url?: string;
};

type DownloadsState = {
  downloads: Record<string, DownloadItem>;
  queue: string[];
  downloadingId?: string;
  enqueueDownload: (item: DownloadItem, url: string) => void;
  pauseDownload: (id: string | number) => void;
  resumeDownload: (id: string | number) => void;
  removeDownload: (id: string | number) => Promise<void>;
  isDownloaded: (id: string | number) => boolean;
  getProgress: (id: string | number) => number;
  getLocalUri: (id: string | number) => string | undefined;
  verifyDownloads: () => Promise<void>;
};

let resumables: Record<string, FileSystem.DownloadResumable> = {};

export const useDownloads = create<DownloadsState>()(
  persist(
    (set, get) => ({
      downloads: {},
      queue: [],
      downloadingId: undefined,

      // 🔹 Add new file to queue
      enqueueDownload: (item, url) => {
        const key = String(item.id);

        // Skip if already downloading or completed
        const existing = get().downloads[key];
        if (
          existing?.status === "downloading" ||
          existing?.status === "completed"
        )
          return;

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

      // 🔹 Pause
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

      // 🔹 Resume
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

      // 🔹 Remove (also delete file)
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
          return {
            downloads: copy,
            queue: s.queue.filter((q) => q !== key),
          };
        });
      },

      // 🔹 Check if downloaded
      isDownloaded: (id) => get().downloads[String(id)]?.status === "completed",

      // 🔹 Get progress
      getProgress: (id) => get().downloads[String(id)]?.progress ?? 0,

      // 🔹 Get file local URI
      getLocalUri: (id) => get().downloads[String(id)]?.localPath,

      // 🔹 Verify files on startup
      verifyDownloads: async () => {
        const { downloads } = get();
        const verified: Record<string, DownloadItem> = {};

        for (const [key, item] of Object.entries(downloads)) {
          if (item.localPath) {
            try {
              const info = await FileSystem.getInfoAsync(item.localPath);
              if (info.exists && info.size > 0) {
                verified[key] = { ...item, progress: 1, status: "completed" };
              } else {
                verified[key] = {
                  ...item,
                  progress: 0,
                  localPath: undefined,
                  status: "failed",
                };
              }
            } catch {
              verified[key] = {
                ...item,
                progress: 0,
                localPath: undefined,
                status: "failed",
              };
            }
          } else {
            verified[key] = { ...item };
          }
        }

        set({ downloads: verified });
      },
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

// ⚙️ Queue processor
async function processQueue() {
  const state = useDownloads.getState();
  if (state.downloadingId || state.queue.length === 0) return;

  const nextId = state.queue[0];
  const item = state.downloads[nextId];
  if (!item?.url) return;

  const ext = item.type === "video" ? ".mp4" : ".mp3";
  const fileUri = `${FileSystem.documentDirectory}${item.id}${ext}`;

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
  useDownloads.setState({ downloadingId: nextId });

  try {
    const result = await resumable.downloadAsync();
    if (result?.uri) {
      useDownloads.setState((s) => ({
        downloads: {
          ...s.downloads,
          [nextId]: {
            ...s.downloads[nextId],
            localPath: result.uri,
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
        [nextId]: {
          ...s.downloads[nextId],
          status: "failed",
          progress: 0,
        },
      },
      queue: s.queue.filter((q) => q !== nextId),
      downloadingId: undefined,
    }));
  }

  // 🚀 Continue next queued download
  setTimeout(processQueue, 500);
}

// ✅ Verify files once on load (auto call)
useDownloads.getState().verifyDownloads();
