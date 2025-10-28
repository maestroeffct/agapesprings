import { useTheme } from "@/store/ThemeContext";
import { useGetVideosQuery } from "@/store/youtubeApi";
import { loadCache, saveCache } from "@/utils/cache";
import { Image as ExpoImage } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Loading from "./Loading";
import VideoRow from "./VideoRow";

export default function VideosList({
  query = "",
  onSelect,
  refreshControl,
}: {
  query?: string;
  onSelect?: (item: any) => void;
  refreshControl?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const { height } = useWindowDimensions();

  const { data, isLoading, isError, isFetching } = useGetVideosQuery(
    { maxResults: 50, pageToken },
    { skip: pageToken === null }
  );

  // ✅ Load cached videos first
  useEffect(() => {
    (async () => {
      const cached = await loadCache<any[]>("videosCache", []);
      if (cached.length) setAllVideos(cached);
    })();
  }, []);

  // ✅ Merge & cache new data, prefetch thumbnails
  useEffect(() => {
    if (data?.items) {
      setAllVideos((prev) => {
        const merged = [...prev, ...data.items];
        saveCache("videosCache", merged);
        merged.forEach((v) => {
          const thumb =
            v.snippet?.thumbnails?.maxres?.url ||
            v.snippet?.thumbnails?.high?.url ||
            v.snippet?.thumbnails?.medium?.url;
          if (thumb) ExpoImage.prefetch(thumb);
        });
        return merged;
      });
      setPageToken(data.nextPageToken ?? null);
    }
  }, [data]);

  const items = !query
    ? allVideos
    : allVideos.filter((v) =>
        v?.snippet?.title?.toLowerCase()?.includes(query.toLowerCase())
      );

  if (isLoading && allVideos.length === 0) {
    return (
      <View style={styles.center}>
        <Loading size={40} />
      </View>
    );
  }

  if (isError && allVideos.length === 0) {
    return (
      <Text style={[styles.error, { color: colors.primary }]}>
        Failed to load videos.
      </Text>
    );
  }

  return (
    <Animated.FlatList
      data={items}
      keyExtractor={(item, i) => `${item.id?.videoId ?? i}`}
      contentContainerStyle={{ paddingVertical: 12 }}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
      renderItem={({ item, index }) => {
        const ITEM_HEIGHT = 150; // approximate height per row
        const inputRange = [
          -1,
          0,
          ITEM_HEIGHT * index,
          ITEM_HEIGHT * (index + 2),
        ];

        const scale = scrollY.interpolate({
          inputRange,
          outputRange: [1, 1, 1, 0.9],
          extrapolate: "clamp",
        });

        const translateY = scrollY.interpolate({
          inputRange,
          outputRange: [0, 0, 0, -20],
          extrapolate: "clamp",
        });

        const opacity = scrollY.interpolate({
          inputRange,
          outputRange: [1, 1, 1, 0.4],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            style={{
              transform: [{ scale }, { translateY }],
              opacity,
            }}
          >
            <VideoRow
              item={item}
              title={item.snippet.title}
              date={new Date(item.snippet.publishedAt).toLocaleDateString()}
              thumb={
                item.snippet.thumbnails?.maxres?.url ||
                item.snippet.thumbnails?.high?.url ||
                item.snippet.thumbnails?.medium?.url
              }
              menuOpen={openMenuId === item.id?.videoId}
              onToggleMenu={() =>
                setOpenMenuId(
                  openMenuId === item.id?.videoId ? null : item.id?.videoId
                )
              }
              closeMenu={() => setOpenMenuId(null)}
              onPress={() => onSelect?.(item)}
            />
          </Animated.View>
        );
      }}
      ItemSeparatorComponent={() => (
        <View
          style={[
            styles.separator,
            { backgroundColor: colors.border, opacity: 0.2 },
          ]}
        />
      )}
      ListFooterComponent={isFetching ? <Loading size={30} /> : null}
    />
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 20, alignItems: "center" },
  error: { marginTop: 8, fontWeight: "600", textAlign: "center" },
  separator: { height: 1 },
});
