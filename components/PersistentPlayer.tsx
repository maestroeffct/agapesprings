// components/PersistentPlayer.tsx
import { useVideo } from "@/store/VideoContext";
import { Dimensions, StyleSheet, View } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";

const { width } = Dimensions.get("window");

export default function PersistentPlayer() {
  const { videoId } = useVideo();
  if (!videoId) return null;

  return (
    <View style={styles.playerWrap}>
      <YoutubePlayer height={50} width={"20px"} play={true} videoId={videoId} />
    </View>
  );
}

const styles = StyleSheet.create({
  playerWrap: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#000",
  },
});
