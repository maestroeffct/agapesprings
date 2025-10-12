// components/AudioTab.tsx
import { getAudioSermons } from "@/api/audio";
import { useDownloads } from "@/store/download";
import { useTheme } from "@/store/ThemeContext";
import { AudioItem } from "@/types";
import { loadCache, saveCache } from "@/utils/cache";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import AudioRow from "./AudioRow";
import Loading from "./Loading";
import SearchFilterBar from "./SearchFilterButtons";

const PLACEHOLDER = require("@/assets/images/aud1.png");
const CACHE_KEY = "audioSermonsCache";

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

function mapToAudioItem(apiItem: any): AudioItem {
  return {
    id: apiItem.id,
    title: apiItem.title ?? "Untitled",
    author: pickAuthor(apiItem),
    tag: apiItem.tags || apiItem.categoryName,
    sizeMB: apiItem.sizeMB,
    dateISO: apiItem.createdAt || apiItem.created_at || apiItem.timePosted,
    thumb: apiItem.thumbnailUrl ? { uri: apiItem.thumbnailUrl } : PLACEHOLDER,
    streamUrl: apiItem.audioUrl || apiItem.url,
    downloadUrl: apiItem.audioUrl || apiItem.url,
  };
}

export default function AudioTab() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [list, setList] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { enqueueDownload } = useDownloads();

  // ✅ Fetch *all* audio once
  const fetchAll = async () => {
    try {
      setLoading(true);
      let all: AudioItem[] = [];
      let page = 1;
      while (true) {
        const remote = await getAudioSermons(page, 50); // fetch in chunks
        const mapped = (remote || []).map(mapToAudioItem);
        all = [...all, ...mapped];
        if (!remote || remote.length < 50) break; // stop if no more
        page++;
      }
      setList(all);
      await saveCache(CACHE_KEY, all);
    } catch (e) {
      console.warn("Failed to fetch audio sermons:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      // ✅ load cached first
      const cached = await loadCache<AudioItem[]>(CACHE_KEY, []);
      if (cached.length) setList(cached);

      // then fetch fresh
      fetchAll();
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((it) => it.title.toLowerCase().includes(q));
  }, [list, query]);

  const handleDownload = (item: AudioItem) => {
    if (!item.downloadUrl) return;
    enqueueDownload(
      {
        id: item.id,
        title: item.title,
        author: item.author,
        thumb: item.thumb,
        type: item.downloadUrl.endsWith(".mp4") ? "video" : "audio",
        size: item.sizeMB ? `${item.sizeMB} MB` : undefined,
      },
      item.downloadUrl
    );
  };

  if (loading && list.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Loading size={60} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SearchFilterBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search all sermons..."
        showFilterButton
        onPressFilter={() => {}}
      />

      <FlatList
        data={filtered}
        keyExtractor={(it) => String(it.id)}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: colors.subtitle,
            }}
          />
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <AudioRow
            item={item}
            index={index}
            fullList={filtered}
            onDownload={() => handleDownload(item)}
            menuOpen={openMenuId === String(item.id)}
            onToggleMenu={() =>
              setOpenMenuId((prev) =>
                prev === String(item.id) ? null : String(item.id)
              )
            }
            closeMenu={() => setOpenMenuId(null)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
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
    </View>
  );
}
