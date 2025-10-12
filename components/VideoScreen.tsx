import { useTheme } from "@/store/ThemeContext";
import { useVideo } from "@/store/VideoContext";
import { useGetVideosQuery } from "@/store/youtubeApi";
import { loadCache, saveCache } from "@/utils/cache";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import ScreenWrapper from "./ScreenWrapper";

const { width } = Dimensions.get("window");
const HERO_HEIGHT = Math.round((width * 9) / 16);

type Props = {
  item: any;
  onClose: () => void;
  onSelect: (it: any) => void;
};

const YT_ID_RE = /[A-Za-z0-9_-]{11}/;
const getVideoId = (v: any): string | undefined => {
  if (!v) return;
  if (v?.snippet?.resourceId?.videoId && YT_ID_RE.test(v.snippet.resourceId.videoId))
    return v.snippet.resourceId.videoId;
  if (v?.contentDetails?.videoId && YT_ID_RE.test(v.contentDetails.videoId))
    return v.contentDetails.videoId;
  if (v?.id?.videoId && YT_ID_RE.test(v.id.videoId)) return v.id.videoId;
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

export default function VideoComponent({ item, onClose, onSelect }: Props) {
  const { colors, isDark } = useTheme();
  const { setVideoId } = useVideo();

  const currentId = getVideoId(item);
  const [openMeta, setOpenMeta] = useState(false);

  // Local state for full list
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, isFetching } = useGetVideosQuery(
    { maxResults: 50, pageToken },
    { skip: pageToken === null }
  );

  // load cached on mount
  useEffect(() => {
    (async () => {
      const cached = await loadCache<any[]>("videosCache", []);
      if (cached.length) setAllVideos(cached);
    })();
  }, []);

  // add new data to state + cache
  useEffect(() => {
    if (data?.items) {
      setAllVideos((prev) => {
        const merged = [...prev, ...data.items];
        saveCache("videosCache", merged);
        return merged;
      });
      setPageToken(data.nextPageToken ?? null);
    }
  }, [data]);

  useEffect(() => {
    if (currentId) setVideoId(currentId);
  }, [currentId]);

  const related = useMemo(() => {
    return allVideos.filter((v) => getVideoId(v) && getVideoId(v) !== currentId);
  }, [allVideos, currentId]);

  return (
    <ScreenWrapper
      barStyle={isDark ? "light-content" : "dark-content"}
      statusBarColor={colors.background}
      style={{ backgroundColor: colors.background }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.backHit}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.topTitle, { color: colors.text }]} numberOfLines={1}>
            {item?.snippet?.title || "Video"}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Hero banner */}
        {currentId && (
          <View style={{ width, height: HERO_HEIGHT, backgroundColor: "#000" }}>
            <YoutubePlayer
              height={HERO_HEIGHT}
              width={width}
              play={true}
              videoId={currentId}
              initialPlayerParams={{
                autoplay: true,
                controls: true,
                modestbranding: true,
                rel: false,
              }}
              webViewStyle={{ flex: 1 }}
              webViewProps={{
                androidLayerType: "hardware",
                allowsFullscreenVideo: true,
              }}
            />
          </View>
        )}

        {/* Title row */}
        <View style={styles.titleWrap}>
          <Text
            style={[styles.pageTitle, { color: colors.text }]}
            numberOfLines={openMeta ? 8 : 2}
          >
            {item?.snippet?.title}
          </Text>
          <TouchableOpacity onPress={() => setOpenMeta((v) => !v)}>
            <Ionicons
              name={openMeta ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.subtitle}
            />
          </TouchableOpacity>
        </View>

        {openMeta && (
          <Text style={[styles.description, { color: colors.subtitle }]}>
            {item?.snippet?.description ?? ""}
          </Text>
        )}

        {/* Related list */}
        <FlatList
          data={related}
          keyExtractor={(v, i) => `${getVideoId(v) ?? "rel"}-${i}`}
          contentContainerStyle={{ paddingBottom: 28 }}
          onEndReached={() => {
            if (pageToken && !isFetching) setPageToken(pageToken);
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item: v }) => {
            const vthumb =
              v?.snippet?.thumbnails?.high?.url ||
              v?.snippet?.thumbnails?.medium?.url;

            return (
              <TouchableOpacity
                onPress={() => onSelect(v)}
                activeOpacity={0.8}
                style={styles.row}
              >
                <ExpoImage
                  source={vthumb ? { uri: vthumb } : require("@/assets/images/event4.png")}
                  placeholder={require("@/assets/images/event4.png")}
                  placeholderContentFit="cover"
                  style={styles.rowThumb}
                  contentFit="cover"
                  transition={300}
                  cachePolicy="disk"
                />
                <View style={styles.rowRight}>
                  <Text
                    style={[styles.rowTitle, { color: colors.text }]}
                    numberOfLines={3}
                  >
                    {v?.snippet?.title}
                  </Text>
                  <Text style={[styles.rowDate, { color: colors.subtitle }]}>
                    {formatDate(v?.snippet?.publishedAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListHeaderComponent={
            <>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                Related
              </Text>
              {isLoading && (
                <ActivityIndicator style={{ marginVertical: 12 }} color={colors.primary} />
              )}
              {isError && (
                <Text style={[styles.error, { color: colors.primary }]}>
                  Failed to load related videos
                </Text>
              )}
            </>
          }
          ListFooterComponent={
            isFetching ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    height: 50,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  backHit: { padding: 6, marginRight: 8 },
  topTitle: { flex: 1, fontSize: 16, fontWeight: "600" },

  titleWrap: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pageTitle: { flex: 1, fontSize: 15, fontWeight: "600" },
  description: { paddingHorizontal: 12, marginBottom: 8, lineHeight: 20 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
  },
  error: { paddingHorizontal: 12, marginBottom: 6 },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  rowThumb: {
    width: 170,
    height: 92,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  rowRight: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "500", marginBottom: 7 },
  rowDate: { fontSize: 12 },
});
