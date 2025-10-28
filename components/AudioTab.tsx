// components/AudioTab.tsx
import { getAudioSermons } from "@/api/audio";
import SearchFilterBar from "@/components/SearchFilterButtons";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { useDownloads } from "@/store/download";
import { useTheme } from "@/store/ThemeContext";
import { AudioItem } from "@/types";
import { loadCache, saveCache } from "@/utils/cache";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Loading from "./Loading";

const PLACEHOLDER = require("@/assets/images/aud_message.png");
const CACHE_KEY = "audioSermonsCache";

/* --------------------------------- HELPERS --------------------------------- */

// Safely pick author
function pickAuthor(a: any): string | undefined {
  return (
    a.author ??
    a.authorName ??
    a.speaker ??
    a.preacher ??
    a.minister ??
    a.pastor ??
    a.artist ??
    a.channelTitle ??
    a.user?.name ??
    [a.user?.firstName, a.user?.lastName].filter(Boolean).join(" ")
  );
}

// Map API item to AudioItem
function mapToAudioItem(apiItem: any): AudioItem {
  return {
    id: apiItem.id,
    title: apiItem.title ?? "Untitled",
    author: pickAuthor(apiItem),
    tag: apiItem.tags || apiItem.categoryName,
    sizeMB: apiItem.sizeMB,
    dateISO:
      apiItem.createdAt ?? apiItem.created_at ?? apiItem.timePosted ?? "",
    thumb: apiItem.thumbnailUrl ?? null,
    streamUrl: apiItem.audioUrl || apiItem.url,
    downloadUrl: apiItem.audioUrl || apiItem.url,
  };
}

/* --------------------------------- ROW ITEM --------------------------------- */

const Row = React.memo(function Row({
  item,
  isCurrent,
  isPlaying,
  colors,
  handlePlay,
  handleDownload,
  isDownloaded,
  progress,
}: {
  item: AudioItem;
  isCurrent: boolean;
  isPlaying: boolean;
  colors: any;
  handlePlay: (item: AudioItem) => void;
  handleDownload: (item: AudioItem) => void;
  isDownloaded: boolean;
  progress: number;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handlePlay(item)}
      style={[
        styles.row,
        { backgroundColor: isCurrent ? colors.card + "33" : "transparent" },
      ]}
    >
      <ExpoImage
        source={item.thumb ? { uri: item.thumb } : PLACEHOLDER}
        contentFit="cover"
        transition={0}
        cachePolicy="disk"
        style={[styles.thumb, { backgroundColor: colors.card }]}
      />

      <View style={styles.info}>
        <Text
          style={[
            styles.title,
            { color: isCurrent ? colors.primary : colors.text },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.artist, { color: colors.subtitle }]}
          numberOfLines={1}
        >
          {item.author || "Unknown Artist"}
        </Text>
      </View>

      <View style={styles.actions}>
        <Ionicons
          name={
            isCurrent && isPlaying
              ? "pause-circle-outline"
              : "play-circle-outline"
          }
          size={26}
          color={isCurrent ? colors.primary : colors.text}
          onPress={() => handlePlay(item)}
        />

        {isDownloaded ? (
          <Ionicons
            name="checkmark-done-outline"
            size={22}
            color={colors.primary}
            style={{ marginLeft: 12 }}
          />
        ) : progress > 0 ? (
          <Text style={{ color: colors.primary, fontSize: 12, marginLeft: 12 }}>
            {Math.floor(progress * 100)}%
          </Text>
        ) : (
          <Ionicons
            name="download-outline"
            size={22}
            color={colors.subtitle}
            style={{ marginLeft: 12 }}
            onPress={() => handleDownload(item)}
          />
        )}
      </View>
    </TouchableOpacity>
  );
});

/* --------------------------------- MAIN TAB --------------------------------- */

export default function AudioTab() {
  const { colors } = useTheme();
  const { play, current, isPlaying } = useAudioPlayer();
  const { enqueueDownload, getLocalUri, isDownloaded, getProgress } =
    useDownloads();

  const scrollY = useRef(new Animated.Value(0)).current;

  const [query, setQuery] = useState("");
  const [list, setList] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Progressive fetch with caching
  const fetchAll = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      let page = 1;
      const newList: AudioItem[] = [];

      while (true) {
        const remote = await getAudioSermons(page, 50);
        if (!remote?.length) break;

        const mapped = remote.map(mapToAudioItem);
        newList.push(...mapped);
        if (remote.length < 50) break;
        page++;
      }

      setList(newList);
      await saveCache(CACHE_KEY, newList);
    } catch (e) {
      console.warn("Failed to fetch audio sermons:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load cache first, then background refresh
  useEffect(() => {
    (async () => {
      try {
        const cached = await loadCache<AudioItem[]>(CACHE_KEY, []);
        if (cached.length) {
          setList(cached);
          setLoading(false);
        }
      } catch (e) {
        console.warn("Cache load failed:", e);
      } finally {
        fetchAll();
      }
    })();
  }, []);

  const onRefresh = () => fetchAll(true);

  // Search filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((it) => it.title.toLowerCase().includes(q));
  }, [list, query]);

  // Download handler
  const handleDownload = (item: AudioItem) => {
    if (!item.downloadUrl) return;
    enqueueDownload(
      {
        id: item.id,
        title: item.title,
        author: item.author,
        thumb: item.thumb ? { uri: item.thumb } : PLACEHOLDER,
        type: item.downloadUrl.endsWith(".mp4") ? "video" : "audio",
        size: item.sizeMB ? `${item.sizeMB} MB` : undefined,
      },
      item.downloadUrl
    );
  };

  // Play handler
  const handlePlay = async (item: AudioItem) => {
    try {
      const local = getLocalUri ? getLocalUri(item.id) : undefined;
      const uri =
        local && local.startsWith("file://")
          ? local
          : local
          ? `file://${local}`
          : item.streamUrl;

      if (!uri) {
        Alert.alert("Playback error", "No valid file or stream URL found.");
        return;
      }

      if (uri.startsWith("file://")) {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists) {
          Alert.alert(
            "Missing file",
            "This downloaded audio file no longer exists."
          );
          return;
        }
      }

      const queue = filtered
        .map((s) => {
          const loc = getLocalUri ? getLocalUri(s.id) : undefined;
          const validUri = loc
            ? loc.startsWith("file://")
              ? loc
              : `file://${loc}`
            : s.streamUrl;
          if (!validUri) return null;
          return {
            id: s.id,
            title: s.title,
            author: s.author || "Unknown Speaker",
            streamUrl: validUri,
            thumb: s.thumb ? { uri: s.thumb } : PLACEHOLDER,
            sourceLabel: loc ? "Offline" : "Online",
          } as AudioItem;
        })
        .filter(Boolean) as AudioItem[];

      await play(
        {
          id: item.id,
          title: item.title,
          author: item.author || "Unknown Speaker",
          streamUrl: uri,
          thumb: item.thumb ? { uri: item.thumb } : PLACEHOLDER,
          sourceLabel: isDownloaded(item.id) ? "Offline" : "Online",
        },
        queue,
        { smooth: true }
      );

      router.push("/audio-player");
    } catch (err) {
      console.error("❌ Audio playback error:", err);
      Alert.alert("Playback error", "Could not play this sermon.");
    }
  };

  /* ----------------------------- MAIN RENDER ----------------------------- */
  return (
    <View style={{ flex: 1 }}>
      <View style={{ marginTop: 3 }}>
        <SearchFilterBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search audio messages..."
          showFilterButton
          onPressFilter={() => {}}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <Loading size={60} />
        </View>
      ) : filtered.length > 0 ? (
        <Animated.FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
              colors={[colors.primary]}
              progressBackgroundColor={colors.card}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          extraData={{ current: current?.id, isPlaying }}
          renderItem={({ item }) => (
            <Row
              item={item}
              isCurrent={String(current?.id) === String(item.id)}
              isPlaying={isPlaying}
              colors={colors}
              handlePlay={handlePlay}
              handleDownload={handleDownload}
              isDownloaded={isDownloaded(item.id)}
              progress={getProgress(item.id) || 0}
            />
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: colors.subtitle,
                opacity: 0.12,
              }}
            />
          )}
          ListEmptyComponent={
            <Text
              style={{
                color: colors.subtitle,
                textAlign: "center",
                paddingVertical: 20,
              }}
            >
              No sermons found.
            </Text>
          }
        />
      ) : (
        <View style={styles.center}>
          <Ionicons
            name="musical-notes-outline"
            size={42}
            color={colors.subtitle}
          />
          <Text style={[styles.empty, { color: colors.subtitle }]}>
            No audio messages
          </Text>
        </View>
      )}
    </View>
  );
}

/* --------------------------------- STYLES --------------------------------- */
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  thumb: { width: 58, height: 58, borderRadius: 8, marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600" },
  artist: { fontSize: 13, marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center" },
  empty: { fontSize: 14, fontWeight: "500" },
});
