import { VideoContextType } from "@/types";
import React, { createContext, ReactNode, useContext, useState } from "react";

const VideoContext = createContext<VideoContextType | undefined>(undefined);

type VideoProviderProps = {
  children: ReactNode;
};

export function VideoProvider({ children }: VideoProviderProps) {
  const [videoId, setVideoId] = useState<string | null>(null);

  return (
    <VideoContext.Provider value={{ videoId, setVideoId }}>
      {children}
    </VideoContext.Provider>
  );
}

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideo must be used within a VideoProvider");
  }
  return context;
};
