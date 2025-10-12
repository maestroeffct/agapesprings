import AnimatedCard from "@/components/AnimatedCard";
import Loading from "@/components/Loading";
import { colors } from "@/constants/theme";
import { useAudioSermons } from "@/hooks/useAudioSermon";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { getField } from "@/utils/media";
import { Image as ExpoImage } from "expo-image";

import { FlatList, Text, TouchableOpacity, View } from "react-native";

export default function AudioSection() {
  const { audio, loading, error } = useAudioSermons();
  const { play } = useAudioPlayer();

  const handlePlay = (item: any) => {
    play({
      id: item.id,
      title: getField(item, ["title", "name"], "Untitled"),
      author: getField(item, ["author", "speaker", "minister"], ""),
      streamUrl: getField(item, ["streamUrl", "fileUrl", "audioUrl"]),
      thumb: {
        uri: getField(item, ["thumbnailUrl", "coverImageUrl", "imageUrl"]),
      },
    });
  };

  return (
    <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
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
        <TouchableOpacity>
          <Text style={{ color: colors.primary }}>View all</Text>
        </TouchableOpacity>
      </View>

      {loading && <Loading size="small" />}
      {error && <Text style={{ color: "red" }}>{error}</Text>}

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={audio}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AnimatedCard
            image={
              <ExpoImage
                source={{
                  uri: getField(item, ["thumbnailUrl", "imageUrl", "picture"]),
                }}
                style={{ width: 140, height: 140, borderRadius: 8 }}
                contentFit="cover"
              />
            }
            title={getField(item, ["title"], "Untitled")}
            onPress={() => handlePlay(item)}
            width={140}
            height={140}
            shouldAnimate={false}
          />
        )}
      />
    </View>
  );
}
