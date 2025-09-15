import TrackPlayer from "react-native-track-player";
import service from "./service"; // ✅ correct import

TrackPlayer.registerPlaybackService(() => service);
