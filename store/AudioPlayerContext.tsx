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
};

type PlayerCtx = {
  current?: AudioItem;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: AudioItem[];
  queueIndex: number;
  play: (item: AudioItem, queue?: AudioItem[]) => Promise<void>;
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

  // ⏱ TrackPlayer progress hook
  const { position, duration } = useProgress();

  // 🎧 Listen for state & track change events
  useTrackPlayerEvents(
    [Event.PlaybackState, Event.PlaybackTrackChanged],
    async (event) => {
      if (event.type === Event.PlaybackState) {
        setIsPlaying(event.state === State.Playing);
      }
      if (event.type === Event.PlaybackTrackChanged) {
        if (event.nextTrack != null) {
          const index = event.nextTrack;
          setQueueIndex(index);
          setCurrent(queue[index]);
        } else {
          setCurrent(undefined);
        }
      }
    }
  );

  // 🟢 Play item (optionally with a full queue)
  const play = async (item: AudioItem, q: AudioItem[] = [item]) => {
    const tracks = q.map((t) => ({
      id: t.id.toString(),
      url: t.streamUrl || t.downloadUrl || "",
      title: t.title,
      artist: t.author || "Unknown Artist",
      artwork: t.thumb,
    }));

    await TrackPlayer.reset();
    await TrackPlayer.add(tracks);
    const idx = q.findIndex((x) => x.id === item.id) || 0;
    await TrackPlayer.skip(idx);
    await TrackPlayer.play();

    setQueue(q);
    setQueueIndex(idx);
    setCurrent(item);
  };

  const pause = async () => TrackPlayer.pause();
  const resume = async () => TrackPlayer.play();
  const stop = async () => {
    await TrackPlayer.stop();
    await TrackPlayer.reset();
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
        setQueue, // 👈 exposed
        setQueueIndex, // 👈 exposed
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
