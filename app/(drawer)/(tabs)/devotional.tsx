import { Devotional, getDevotionals } from "@/api/devotional";
import DevoImagesGrid from "@/components/DevoImagesGrid";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useDevotionalFaves } from "@/store/DevotionalFavesContext";
import { useTheme } from "@/store/ThemeContext";
import {
  loadDevotionalCache,
  saveDevotionalCache,
} from "@/utils/prefetchDevotionals";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

type TabKey = "Latest" | "Favourites";

export default function DevotionalScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const {
    favIds,
    favData,
    toggle: handleToggleFave,
    refresh: refreshFaves,
  } = useDevotionalFaves();

  const [tab, setTab] = useState<TabKey>("Latest");
  const [latestData, setLatestData] = useState<Devotional[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  /** 🔹 Fetch a page + update cache */
  const loadPage = async (p: number) => {
    try {
      setLoadingMore(true);
      const res = await getDevotionals(p, 20);

      setLatestData((prev) => {
        const merged = p === 1 ? res.data : [...prev, ...res.data];
        saveDevotionalCache(merged);
        return merged;
      });

      setPage(res.pagination.page);
      setHasMore(res.pagination.page < res.pagination.totalPages);
    } catch (err) {
      console.error("⚠️ Failed to load devotionals:", err);
    } finally {
      setLoadingMore(false);
      if (p === 1) setInitialLoading(false);
    }
  };

  /** 🔹 Refresh */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.allSettled([loadPage(1), refreshFaves()]);
    } finally {
      setRefreshing(false);
    }
  };

  /** 🔹 Load More (pagination) */
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) loadPage(page + 1);
  }, [loadingMore, hasMore, page]);

  /** ⚡ Optimized Mount: show cache instantly + background fetch */
  useEffect(() => {
    let didCancel = false;

    (async () => {
      const cached = await loadDevotionalCache();

      if (!didCancel && cached.length) {
        // ✅ show cache instantly
        setLatestData(cached);
        setInitialLoading(false);
      }

      // ⚙️ then do a background refresh after frame paint
      requestAnimationFrame(async () => {
        try {
          await Promise.allSettled([loadPage(1), refreshFaves()]);
        } catch (err) {
          console.error("⚠️ Background refresh error:", err);
          if (!didCancel) setInitialLoading(false);
        }
      });
    })();

    return () => {
      didCancel = true;
    };
  }, []);

  /** 🔹 Pager & Tab logic */
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
      <Header
        title="Devotionals"
        rightIcons={[
          {
            name: "download-outline",
            onPress: () => router.push("/devotionalDownloads"),
          },
        ]}
      />

      {/* Tabs */}
      <View
        style={[styles.tabsRow, { borderBottomColor: colors.subtitle }]}
        onLayout={(e) => setTabsW(e.nativeEvent.layout.width - 28)}
      >
        {(["Latest", "Favourites"] as TabKey[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={styles.tabBtn}
            onPress={() => goTo(t)}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === t ? colors.text : colors.subtitle },
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}

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
          {
            useNativeDriver: false,
          }
        )}
      >
        {/* 🔸 Latest Tab */}
        <View style={{ width }}>
          {initialLoading ? (
            <View style={styles.center}>
              <Loading size={40} />
            </View>
          ) : latestData.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.subtitle }]}>
                No devotionals yet
              </Text>
            </View>
          ) : (
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
          )}
        </View>

        {/* 🔸 Favourites Tab */}
        <View style={{ width, flex: 1 }}>
          {initialLoading ? (
            <View style={styles.center}>
              <Loading size={40} />
            </View>
          ) : favData.length === 0 ? (
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

/* ---------- Styles ---------- */
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
