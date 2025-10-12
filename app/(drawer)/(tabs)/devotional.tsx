import DevoImagesGrid from "@/components/DevoImagesGrid";
import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useTheme } from "@/store/ThemeContext";

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Devotional, getDevotionals } from "@/api/devotional";
import {
  getFavedDevotionals,
  getFavedIds,
  toggleFave,
} from "@/store/devotionalFaves";
import {
  loadDevotionalCache,
  saveDevotionalCache,
} from "@/utils/prefetchDevotionals";
import { router } from "expo-router";

type TabKey = "Latest" | "Favourites";

export default function DevotionalScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const [tab, setTab] = useState<TabKey>("Latest");
  const [latestData, setLatestData] = useState<Devotional[]>([]);
  const [favIds, setFavIds] = useState<number[]>([]);
  const [favData, setFavData] = useState<Devotional[]>([]);

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔹 Refresh Latest
  async function handleRefresh() {
    try {
      setRefreshing(true);
      await loadPage(1);
      const ids = await getFavedIds();
      setFavIds(ids);

      const favs = await getFavedDevotionals();
      setFavData(favs);
    } finally {
      setRefreshing(false);
    }
  }

  // 🔹 Load from API (but keep cache)
  async function loadPage(p: number) {
    try {
      setLoadingMore(true);
      const res = await getDevotionals(p, 80);

      if (p === 1) {
        setLatestData(res.data);
        await saveDevotionalCache(res.data); // now also downloads images
      } else {
        setLatestData((prev) => {
          const merged = [...prev, ...res.data];
          saveDevotionalCache(merged);
          return merged;
        });
      }

      setPage(res.pagination.page);
      setHasMore(res.pagination.page < res.pagination.totalPages);
    } catch (err) {
      console.error("Failed to load devotionals", err);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    if (!loadingMore && hasMore) {
      loadPage(page + 1);
    }
  }

  // 🔹 Load cache first, then sync
  useEffect(() => {
    (async () => {
      const cached = await loadDevotionalCache();
      if (cached.length) setLatestData(cached);

      const ids = await getFavedIds();
      setFavIds(ids);

      const favs = await getFavedDevotionals();
      setFavData(favs);

      // 🔄 Sync in background
      loadPage(1);
    })();
  }, []);

  const handleToggleFave = async (id: number, devo?: Devotional) => {
    const updated = await toggleFave(id, devo);
    setFavIds(updated);

    const favs = await getFavedDevotionals();
    setFavData(favs);
  };

  // 🔹 Pager underline animation
  const pagerRef = useRef<ScrollView | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [tabsW, setTabsW] = useState(0);
  const underlineTranslateX = scrollX.interpolate({
    inputRange: [0, width],
    outputRange: [0, tabsW / 2],
    extrapolate: "clamp",
  });

  const goTo = (t: TabKey) => {
    setTab(t);
    const idx = t === "Latest" ? 0 : 1;
    pagerRef.current?.scrollTo({ x: idx * width, y: 0, animated: true });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setTab(idx === 0 ? "Latest" : "Favourites");
  };

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      statusBarColor={colors.background}
      barStyle={
        colors.background === "#111827" ? "light-content" : "dark-content"
      }
    >
      <Header title="Devotionals" />

      {/* Tabs */}
      <View
        style={[styles.tabsRow, { borderBottomColor: colors.subtitle }]}
        onLayout={(e) => setTabsW(e.nativeEvent.layout.width - 28)}
      >
        <TouchableOpacity style={styles.tabBtn} onPress={() => goTo("Latest")}>
          <Text
            style={[
              styles.tabText,
              { color: tab === "Latest" ? colors.text : colors.subtitle },
            ]}
          >
            Latest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => goTo("Favourites")}
        >
          <Text
            style={[
              styles.tabText,
              { color: tab === "Favourites" ? colors.text : colors.subtitle },
            ]}
          >
            Favourites
          </Text>
        </TouchableOpacity>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.movingUnderline,
            {
              width: tabsW / 2 || 0,
              transform: [{ translateX: underlineTranslateX }],
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>

      {/* Pager */}
      <Animated.ScrollView
        ref={(r) => (pagerRef.current = r)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Latest */}
        <View style={{ width }}>
          <DevoImagesGrid
            data={latestData}
            favIds={favIds}
            onToggleFave={handleToggleFave}
            onEndReached={handleLoadMore}
            loadingMore={loadingMore}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onPressItem={(item) =>
              router.push({
                pathname: "/devotional/[id]",
                params: { id: String(item.id) },
              })
            }
          />
        </View>

        {/* Favourites */}
        <View style={{ width, flex: 1 }}>
          {favData.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.subtitle }]}>
                No favourites yet
              </Text>
            </View>
          ) : (
            <DevoImagesGrid
              data={favData}
              favIds={favIds}
              onToggleFave={handleToggleFave}
              loadingMore={false}
              onPressItem={(item) =>
                router.push({
                  pathname: "/devotional/[id]",
                  params: { id: String(item.id) },
                })
              }
            />
          )}
        </View>
      </Animated.ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabText: { fontSize: 14, fontWeight: "700" },
  movingUnderline: {
    position: "absolute",
    bottom: -1,
    left: 14,
    height: 3,
    borderRadius: 2,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: { fontSize: 14, fontWeight: "600" },
});
