// app/video/testimonies.tsx
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import VideoComponent from "@/components/VideoScreen";
import { colors } from "@/constants/theme";
import { useTestimonies } from "@/hooks/useTestimonies";
import { getBestThumb } from "@/utils/media";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function TestimonyListScreen() {
  const { testimonyCache, isLoading, isError } = useTestimonies();
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  if (selectedVideo)
    return (
      <VideoComponent
        item={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onSelect={setSelectedVideo}
      />
    );

  return (
    <ScreenWrapper>
      <TopBar
        title="Testimonies"
        leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
      />

      {isLoading && <Loading size="large" />}
      {isError && (
        <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
          Failed to load testimonies.
        </Text>
      )}

      <FlatList
        data={testimonyCache}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedVideo(item)}
          >
            <ExpoImage
              source={{ uri: getBestThumb(item.snippet.thumbnails) }}
              style={styles.thumbnail}
              contentFit="cover"
              placeholder={require("@/assets/images/aud_message.png")}
              placeholderContentFit="cover"
            />
            <Text style={styles.title} numberOfLines={2}>
              {item.snippet.title}
            </Text>
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 2,
  },
  thumbnail: { width: "100%", height: 200 },
  title: {
    padding: 10,
    fontSize: 15,
    fontWeight: "500",
    color: colors.primary,
  },
});
