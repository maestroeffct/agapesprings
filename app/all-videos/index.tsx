// app/videos/all.tsx
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { colors } from "@/constants/theme";
import { useVideoSermons } from "@/hooks/useVideoSermon";
import { getBestThumb } from "@/utils/media";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AllVideosScreen() {
  const { videoCache, isLoading, loadMore, loadingMore, hasMore } =
    useVideoSermons();

  return (
    <ScreenWrapper style={styles.container}>
      <TopBar
        title="Latest Video Sermon"
        leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
      />

      {isLoading && videoCache.length === 0 && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <FlatList
        data={videoCache}
        keyExtractor={(item, index) => `${item.id || index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        onEndReached={() => {
          if (!loadingMore && hasMore) loadMore();
        }}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/video",
                params: { id: item.snippet.resourceId.videoId },
              })
            }
          >
            <View style={styles.thumbnailWrap}>
              <ExpoImage
                source={{ uri: getBestThumb(item.snippet.thumbnails) }}
                style={styles.thumbnail}
                contentFit="cover"
                placeholder={require("@/assets/images/flow1.png")}
                placeholderContentFit="cover"
                transition={100}
              />
              <View style={styles.durationTag}>
                <Text style={styles.durationText}>02:48:12</Text>
              </View>
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {item.snippet.title}
            </Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { marginBottom: 20 },
  thumbnailWrap: {
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  durationTag: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "black",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  title: {
    marginTop: 8,
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
