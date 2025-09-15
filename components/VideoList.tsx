import { useTheme } from "@/store/ThemeContext";
import { useGetVideosQuery } from "@/store/youtubeApi";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Loading from "./Loading";
import VideoRow from "./VideoRow";

const YT_ID_RE = /[A-Za-z0-9_-]{11}/;

const getVideoId = (v: any): string | undefined => {
  if (!v) return;
  if (
    v?.snippet?.resourceId?.videoId &&
    YT_ID_RE.test(v.snippet.resourceId.videoId)
  )
    return v.snippet.resourceId.videoId;
  if (v?.contentDetails?.videoId && YT_ID_RE.test(v.contentDetails.videoId))
    return v.contentDetails.videoId;
  if (v?.id?.videoId && YT_ID_RE.test(v.id.videoId)) return v.id.videoId;

  const candidates: string[] = [];
  if (typeof v?.id === "string") candidates.push(v.id);
  if (typeof v?.snippet?.videoUrl === "string")
    candidates.push(v.snippet.videoUrl);
  if (typeof v?.snippet?.url === "string") candidates.push(v.snippet.url);
  for (const s of candidates) {
    const token = s.match(YT_ID_RE)?.[0];
    if (token) return token;
  }
  const t =
    v?.snippet?.thumbnails?.maxres?.url ||
    v?.snippet?.thumbnails?.high?.url ||
    v?.snippet?.thumbnails?.medium?.url ||
    v?.snippet?.thumbnails?.default?.url;
  if (typeof t === "string") {
    const m = t.match(/\/vi(?:_webp)?\/([A-Za-z0-9_-]{11})\//);
    if (m?.[1]) return m[1];
  }
  return undefined;
};

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const day = d.toLocaleDateString(undefined, { weekday: "long" });
  const date = d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${day} ${date}`;
};

type Props = {
  query?: string;
  onSelect?: (item: any) => void;
  pageSize?: number;
};

export default function VideosList({
  query = "",
  onSelect,
  pageSize = 100,
}: Props) {
  const { colors } = useTheme();
  const { data, isLoading, isError } = useGetVideosQuery(pageSize);

  const items = useMemo(() => {
    const all = data?.items ?? [];
    if (!query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter((v: any) =>
      v?.snippet?.title?.toLowerCase()?.includes(q)
    );
  }, [data, query]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Loading size={25} />
      </View>
    );
  }
  if (isError) {
    return (
      <Text style={[styles.error, { color: colors.primary }]}>
        Failed to load videos.
      </Text>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item, i) =>
        `${getVideoId(item) ?? item?.id ?? "vid"}-${i}`
      }
      renderItem={({ item }) => (
        <VideoRow
          item={item}
          title={item?.snippet?.title}
          date={formatDate(item?.snippet?.publishedAt)}
          thumb={
            item?.snippet?.thumbnails?.maxres?.url ||
            item?.snippet?.thumbnails?.high?.url ||
            item?.snippet?.thumbnails?.medium?.url
          }
        />
      )}
      ItemSeparatorComponent={() => (
        <View style={[styles.separator, { backgroundColor: colors.card }]} />
      )}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <Text style={[styles.empty, { color: colors.subtitle }]}>
          No videos found.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 20, alignItems: "center" },
  error: { marginTop: 8, fontWeight: "600" },
  empty: { textAlign: "center", paddingVertical: 20 },
  separator: { height: 1 },
});
