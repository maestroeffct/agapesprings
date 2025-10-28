import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { colors } from "@/constants/theme";
import { useAudioSermons } from "@/hooks/useAudioSermon";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { getField } from "@/utils/media";
import * as FileSystem from "expo-file-system";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AllAudiosScreen() {
  const { audio, loading, error } = useAudioSermons({
    limit: 100000, // fetch all
  });

  const { play } = useAudioPlayer();
  const [localThumbs, setLocalThumbs] = useState<Record<string, string>>({});

  // ✅ Prefetch thumbnails to disk cache
  useEffect(() => {
    if (audio?.length) {
      audio.forEach((item) => {
        const url = getField(item, [
          "thumbnailUrl",
          "imageUrl",
          "picture",
          "coverImageUrl",
        ]);
        if (url) ExpoImage.prefetch(url); // warm up cache
      });
    }
  }, [audio]);

  // ✅ Download and persist thumbnails to FileSystem for offline reuse
  useEffect(() => {
    const cacheThumbnails = async () => {
      const thumbs: Record<string, string> = {};
      for (const item of audio) {
        const url = getField(item, [
          "thumbnailUrl",
          "imageUrl",
          "picture",
          "coverImageUrl",
        ]);
        if (!url) continue;

        try {
          const fileName = url.split("/").pop();
          const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
          const info = await FileSystem.getInfoAsync(fileUri);

          if (!info.exists) {
            await FileSystem.downloadAsync(url, fileUri);
          }

          thumbs[item.id] = fileUri;
        } catch (e) {
          console.warn("Failed to cache image:", e);
        }
      }
      setLocalThumbs(thumbs);
    };

    if (audio.length) cacheThumbnails();
  }, [audio]);

  // ✅ Build playback queue
  const buildQueue = (list: any[]) =>
    list.map((item) => ({
      id: item.id,
      title: getField(item, ["title", "name"], "Untitled"),
      author: getField(item, ["author", "speaker", "minister"], ""),
      streamUrl: getField(item, ["streamUrl", "fileUrl", "audioUrl"]),
      thumb: {
        uri:
          localThumbs[item.id] ||
          getField(item, [
            "thumbnailUrl",
            "coverImageUrl",
            "imageUrl",
            "picture",
          ]),
      },
    }));

  // ✅ Handle play
  const handlePlay = async (selected: any) => {
    const queue = buildQueue(audio);
    const selectedTrack = queue.find((q) => q.id === selected.id);
    if (selectedTrack) {
      await play(selectedTrack, queue);
      router.push("/audio-player");
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header */}
      <TopBar
        title="Latest Audio Sermons"
        leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
      />

      {/* Loading */}
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Error */}
      {error && (
        <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
          {error}
        </Text>
      )}

      {/* Audio Grid */}
      {!loading && !error && (
        <FlatList
          data={audio}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => {
            const uri =
              localThumbs[item.id] ||
              getField(item, [
                "thumbnailUrl",
                "imageUrl",
                "picture",
                "coverImageUrl",
              ]);

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.card}
                onPress={() => handlePlay(item)}
              >
                <View style={styles.thumbnailWrap}>
                  <ExpoImage
                    source={{ uri }}
                    style={styles.thumbnail}
                    contentFit="cover"
                    placeholder={require("@/assets/images/aud_message.png")}
                    placeholderContentFit="cover"
                    cachePolicy="disk" // ✅ persistent caching
                    recyclingKey={String(item.id)}
                    transition={150}
                  />
                </View>

                <Text style={styles.title} numberOfLines={2}>
                  {getField(item, ["title"], "Untitled")}
                </Text>
                <Text style={styles.speaker} numberOfLines={1}>
                  {getField(item, ["author", "speaker", "minister"], "")}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "48%",
    marginBottom: 22,
  },
  thumbnailWrap: {
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  title: {
    marginTop: 8,
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  speaker: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});
