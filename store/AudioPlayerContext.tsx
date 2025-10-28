import React, { createContext, useContext, useState } from "react";
import TrackPlayer, {
  Event,
  State,
  useProgress,
  useTrackPlayerEvents,
} from "react-native-track-player";

export type AudioItem = {
  id: string | number;
  title: string;
  author?: string;
  streamUrl?: string;
  downloadUrl?: string;
  thumb?: any;
  lyrics?: string; // ✅ Add this
  sourceLabel?: string; // e.g., "YouTube", "SoundCloud"
};

type PlayerCtx = {
  current?: AudioItem;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: AudioItem[];
  queueIndex: number;
  play: (
    item: AudioItem,
    queue?: AudioItem[],
    opts?: { smooth?: boolean }
  ) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  toggle: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  setQueue: React.Dispatch<React.SetStateAction<AudioItem[]>>;
  setQueueIndex: React.Dispatch<React.SetStateAction<number>>;
};

const Ctx = createContext<PlayerCtx | undefined>(undefined);

export function AudioPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queue, setQueue] = useState<AudioItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [current, setCurrent] = useState<AudioItem | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);

  const { position, duration } = useProgress();

  // 🎧 React to player state changes
  useTrackPlayerEvents(
    [Event.PlaybackState, Event.PlaybackTrackChanged],
    async (event) => {
      if (event.type === Event.PlaybackState) {
        setIsPlaying(event.state === State.Playing);
      }
      if (event.type === Event.PlaybackTrackChanged) {
        if (event.nextTrack != null && queue[event.nextTrack]) {
          setQueueIndex(event.nextTrack);
          setCurrent(queue[event.nextTrack]);
        }
      }
    }
  );

  // 🟢 Smooth "play" logic
  const play = async (
    item: AudioItem,
    q: AudioItem[] = [item],
    opts?: { smooth?: boolean }
  ) => {
    try {
      const activeTrack = await TrackPlayer.getActiveTrack();
      const activeId = activeTrack?.id?.toString?.();
      const sameTrack = activeId === item.id.toString();

      if (sameTrack) {
        await TrackPlayer.play();
        return;
      }

      const sameQueue =
        q.length === queue.length &&
        q.every((track, i) => track.id === queue[i]?.id);

      const idx = q.findIndex((x) => x.id === item.id) || 0;

      // 🧠 Instantly reflect new track in UI
      setCurrent(item);
      setQueue(q);
      setQueueIndex(idx);

      // 🕐 Instead of resetting immediately, fade out current audio first
      if (isPlaying) await TrackPlayer.pause();

      // 🧩 Delay a few ms to let UI settle — prevents flicker
      await new Promise((res) => setTimeout(res, 100));

      // 🧱 Now safely reset and prepare
      await TrackPlayer.reset();

      const tracks = q.map((t) => ({
        id: t.id.toString(),
        url: t.streamUrl || t.downloadUrl || "",
        title: t.title,
        artist: t.author || "Unknown Artist",
        artwork: t.thumb,
      }));
      await TrackPlayer.add(tracks);

      await TrackPlayer.skip(idx);
      await TrackPlayer.play();
    } catch (e) {
      console.warn("Error in play():", e);
    }
  };

  const pause = async () => TrackPlayer.pause();
  const resume = async () => TrackPlayer.play();

  const stop = async () => {
    try {
      await TrackPlayer.stop();
      await TrackPlayer.reset();
    } catch {}
    setCurrent(undefined);
    setQueue([]);
    setQueueIndex(0);
    setIsPlaying(false);
  };

  const seekTo = async (ms: number) => TrackPlayer.seekTo(ms / 1000);
  const toggle = async () => (isPlaying ? pause() : resume());

  const skipToNext = async () => {
    try {
      await TrackPlayer.skipToNext();
      const newIndex = queueIndex + 1;
      if (newIndex < queue.length) {
        setQueueIndex(newIndex);
        setCurrent(queue[newIndex]);
      }
    } catch {
      console.warn("No next track");
    }
  };

  const skipToPrevious = async () => {
    try {
      await TrackPlayer.skipToPrevious();
      const newIndex = queueIndex - 1;
      if (newIndex >= 0) {
        setQueueIndex(newIndex);
        setCurrent(queue[newIndex]);
      }
    } catch {
      console.warn("No previous track");
    }
  };

  return (
    <Ctx.Provider
      value={{
        current,
        isPlaying,
        position: position * 1000,
        duration: duration * 1000,
        queue,
        queueIndex,
        play,
        pause,
        resume,
        stop,
        seekTo,
        toggle,
        skipToNext,
        skipToPrevious,
        setQueue,
        setQueueIndex,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAudioPlayer = () => {
  const v = useContext(Ctx);
  if (!v)
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return v;
};
