import { useTheme } from "@/store/ThemeContext";
import { useGetPremiereVideosQuery } from "@/store/youtubeApi";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PremiereTab({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { colors } = useTheme();

  const [videos, setVideos] = useState<any[]>([]);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, isFetching, error, refetch } = useGetPremiereVideosQuery(
    { maxResults: 10, pageToken },
    { refetchOnMountOrArgChange: true }
  );

  // ✅ Merge new data when fetched
  useEffect(() => {
    if (data?.items) {
      setVideos((prev) => (pageToken ? [...prev, ...data.items] : data.items));
    }
  }, [data]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && data?.nextPageToken && !isFetching) {
      setIsLoadingMore(true);
      setPageToken(data.nextPageToken);
      setTimeout(() => setIsLoadingMore(false), 500);
    }
  }, [data, isLoadingMore, isFetching]);

  const handleRefresh = useCallback(() => {
    setVideos([]);
    setPageToken(undefined);
    refetch();
    onRefresh();
  }, [refetch, onRefresh]);

  const renderItem = useCallback(
    ({ item }: any) => {
      const snippet = item?.snippet;
      if (!snippet) return null;
      const thumb = snippet?.thumbnails?.high?.url;

      return (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card }]}
          activeOpacity={0.9}
          onPress={() =>
            router.push({
              pathname: "/video",
              params: { item: encodeURIComponent(JSON.stringify(item)) },
            })
          }
        >
          <ExpoImage
            source={{ uri: thumb }}
            style={styles.thumb}
            placeholder={require("@/assets/images/vid_cover.png")}
            placeholderContentFit="cover"
            contentFit="cover"
          />
          <View style={styles.textWrap}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={2}
            >
              {snippet.title}
            </Text>
            <Text
              style={[styles.channel, { color: colors.subtitle }]}
              numberOfLines={1}
            >
              {snippet.channelTitle}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [colors]
  );

  return (
    <FlatList
      data={videos}
      keyExtractor={(item, index) => item?.id?.videoId ?? `${index}`}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.6}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || isFetching}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListFooterComponent={
        isFetching || isLoadingMore ? (
          <ActivityIndicator
            style={{ marginVertical: 20 }}
            color={colors.primary}
          />
        ) : null
      }
      ListEmptyComponent={
        !isFetching ? (
          <Text
            style={{
              color: colors.subtitle,
              textAlign: "center",
              marginTop: 40,
              fontSize: 15,
            }}
          >
            No premiere videos found.
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    marginBottom: 14,
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: 190,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  textWrap: {
    padding: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  channel: {
    fontSize: 13,
  },
});
