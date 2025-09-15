// components/AudioTab.tsx
import { getAudioSermons } from "@/api/audio";
import { useDownloads } from "@/store/download";
import { useTheme } from "@/store/ThemeContext";
import { AudioItem } from "@/types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AudioRow from "./AudioRow";
import SearchFilterBar from "./SearchFilterButtons";

type Props = {
  onDownload?: (item: AudioItem) => void;
  onShare?: (item: AudioItem) => void;
};

const PLACEHOLDER = require("@/assets/images/aud1.png");

// Try to pull author from multiple possible backend fields
function pickAuthor(a: any): string | undefined {
  const direct =
    a.author ??
    a.authorName ??
    a.speaker ??
    a.preacher ??
    a.minister ??
    a.pastor ??
    a.artist ??
    a.channelTitle;
  if (direct) return String(direct);
  const nested =
    a.user?.name ??
    [a.user?.firstName, a.user?.lastName].filter(Boolean).join(" ");
  return nested ? String(nested) : undefined;
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

const PAGE_SIZE = 10;

export default function AudioTab({ onDownload, onShare }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [list, setList] = useState<AudioItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const seen = useRef<Set<string | number>>(new Set());

  const prefetchThumbs = useCallback(async (items: AudioItem[]) => {
    await Promise.all(
      items.map((it) =>
        typeof it.thumb === "object" && (it.thumb as any)?.uri
          ? Image.prefetch((it.thumb as any).uri)
          : Promise.resolve()
      )
    );
  }, []);

  const merge = useCallback((prev: AudioItem[], incoming: AudioItem[]) => {
    const out: AudioItem[] = [...prev];
    for (const it of incoming) {
      if (!seen.current.has(it.id)) {
        seen.current.add(it.id);
        out.push(it);
      }
    }
    return out;
  }, []);

  const loadPage = useCallback(
    async (nextPage: number, replace = false, preload = false) => {
      const remote = await getAudioSermons(nextPage, PAGE_SIZE);
      const mapped = (remote || []).map(mapToAudioItem);
      await prefetchThumbs(mapped);
      const more = mapped.length === PAGE_SIZE;
      setHasMore(more);
      setList((prev) => (replace ? mapped : merge(prev, mapped)));
      setPage(nextPage);

      if (!preload && more) {
        loadPage(nextPage + 1, false, true).catch(() => {});
      }
    },
    [merge, prefetchThumbs]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadPage(1, true);
      } catch (e) {
        console.warn("Failed to load audio sermons:", e);
      } finally {
        if (mounted) setLoadingInitial(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadPage]);

  const onEndReached = useCallback(async () => {
    if (query.trim()) return;
    if (loadingMore || loadingInitial || !hasMore) return;
    setLoadingMore(true);
    try {
      await loadPage(page + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [query, loadingMore, loadingInitial, hasMore, loadPage, page]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      seen.current.clear();
      await loadPage(1, true);
    } catch (e) {
      console.warn("Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  }, [loadPage]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((it) => it.title.toLowerCase().includes(q));
  }, [list, query]);

  const { enqueueDownload } = useDownloads();

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

  return (
    <View>
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
            index={index} // 👈 pass index
            fullList={filtered} // 👈 pass the full list
            onDownload={() => handleDownload(item)}
            onShare={onShare}
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
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        ListEmptyComponent={
          <Text
            style={{
              color: colors.subtitle,
              textAlign: "center",
              paddingVertical: 20,
            }}
          >
            {loadingInitial
              ? "Loading sermons..."
              : "No sermons match your search."}
          </Text>
        }
        ListFooterComponent={
          !query.trim() ? (
            loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : !hasMore && list.length > 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  color: colors.subtitle,
                  paddingVertical: 12,
                }}
              >
                • End of list •
              </Text>
            ) : null
          ) : null
        }
      />
    </View>
  );
}
