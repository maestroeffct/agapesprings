import AnimatedCard from "@/components/AnimatedCard";
import Loading from "@/components/Loading";
import { colors } from "@/constants/theme";
import { useAudioSermons } from "@/hooks/useAudioSermon";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { getField } from "@/utils/media";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

export default function AudioSection() {
  const { audio, loading, error } = useAudioSermons({ limit: 10 });
  const { play } = useAudioPlayer();

  // 🔹 Convert list to TrackPlayer format
  const buildQueue = (list: any[]) =>
    list.map((item) => ({
      id: item.id,
      title: getField(item, ["title", "name"], "Untitled"),
      author: getField(item, ["author", "speaker", "minister"], ""),
      streamUrl: getField(item, ["streamUrl", "fileUrl", "audioUrl"]),
      thumb: {
        uri: getField(item, ["thumbnailUrl", "coverImageUrl", "imageUrl"]),
      },
    }));

  const handlePlay = async (selected: any) => {
    const queue = buildQueue(audio);
    const selectedTrack = queue.find((q) => q.id === selected.id);
    if (selectedTrack) {
      await play(selectedTrack, queue);
    }
  };

  return (
    <View style={{ marginTop: 20, paddingHorizontal: 16, marginBottom: 30 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text
          style={{
            fontWeight: "bold",
            color: colors.primary,
            fontSize: 16,
            marginBottom: 10,
          }}
        >
          Latest Audio Sermon
        </Text>
        <TouchableOpacity onPress={() => router.push("/audio/all")}>
          <Text style={{ color: colors.primary }}>View all</Text>
        </TouchableOpacity>
      </View>

      {/* Full-section loader / Error */}
      {loading ? (
        <View
          style={{
            height: 160,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Loading size={30} />
        </View>
      ) : error ? (
        <Text style={{ color: "red" }}>{error}</Text>
      ) : (
        // Only render list if not loading
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={audio}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <AnimatedCard
              index={index} // enables staggered entrance
              image={
                <ExpoImage
                  source={{
                    uri: getField(item, [
                      "thumbnailUrl",
                      "imageUrl",
                      "picture",
                    ]),
                  }}
                  style={{ width: 140, height: 140, borderRadius: 8 }}
                  contentFit="cover"
                  placeholder={require("@/assets/images/aud_message.png")}
                  placeholderContentFit="cover"
                />
              }
              title={getField(item, ["title"], "Untitled")}
              onPress={() => handlePlay(item)}
              width={140}
              height={140}
              shouldAnimate
            />
          )}
        />
      )}
    </View>
  );
}
