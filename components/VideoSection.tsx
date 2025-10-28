import AnimatedCard from "@/components/AnimatedCard";
import Loading from "@/components/Loading";
import { colors } from "@/constants/theme";
import { useVideoSermons } from "@/hooks/useVideoSermon";
import { getBestThumb } from "@/utils/media";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";

import { FlatList, Text, TouchableOpacity, View } from "react-native";

export default function VideoSection({
  onSelect,
}: {
  onSelect: (v: any) => void;
}) {
  const { videoCache, isLoading, isError } = useVideoSermons();

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
          Latest Video Sermon
        </Text>
        <TouchableOpacity onPress={() => router.push("/video/all")}>
          <Text style={{ color: colors.primary }}>View all</Text>
        </TouchableOpacity>
      </View>

      {isLoading && !videoCache.length && <Loading size="large" />}
      {isError && !videoCache.length && (
        <Text style={{ color: "red" }}>Failed to load videos.</Text>
      )}

      {videoCache.length > 0 && (
        <FlatList
          horizontal
          data={videoCache}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item, index }) => (
            <AnimatedCard
              image={
                <ExpoImage
                  source={{ uri: getBestThumb(item.snippet.thumbnails) }}
                  style={{ flex: 1, borderRadius: 8 }}
                  contentFit="cover"
                  placeholder={require("@/assets/images/vid_cover.png")}
                  placeholderContentFit="cover"
                />
              }
              title={item.snippet.title}
              shouldAnimate={index === 0}
              onPress={() => onSelect(item)}
            />
          )}
        />
      )}
    </View>
  );
}
