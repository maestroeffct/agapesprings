// service.ts
import TrackPlayer, { Event } from "react-native-track-player";

export default async function () {
  console.log("🎧 Background service started");

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    console.log("▶️ Remote Play pressed");
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    console.log("⏸️ Remote Pause pressed");
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    console.log("⏹️ Remote Stop pressed");
    await TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => {
    console.log("⏩ Remote Seek:", e.position);
    TrackPlayer.seekTo(e.position);
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    console.log("⏭️ Remote Next pressed");
    TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    console.log("⏮️ Remote Previous pressed");
    TrackPlayer.skipToPrevious();
  });
}
