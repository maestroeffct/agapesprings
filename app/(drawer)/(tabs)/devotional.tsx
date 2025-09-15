// app/(tabs)/DevotionalScreen.tsx
import DevoImagesGrid from "@/components/DevoImagesGrid";
import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useTheme } from "@/store/ThemeContext";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { getFavedIds, toggleFave } from "@/store/devotionalFaves";
import { router } from "expo-router";

type TabKey = "Latest" | "Favourites";

export default function DevotionalScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const [tab, setTab] = useState<TabKey>("Latest");
  const [qLatest, setQLatest] = useState("");
  const [qFav, setQFav] = useState("");

  // Data states
  const [latestData, setLatestData] = useState<Devotional[]>([]);
  const [favIds, setFavIds] = useState<number[]>([]);
  const [favData, setFavData] = useState<Devotional[]>([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await loadPage(1); // reload first page
      const ids = await getFavedIds();
      setFavIds(ids);
    } finally {
      setRefreshing(false);
    }
  }

  /** --------- Load devotionals (paginated) --------- */
  async function loadPage(p: number) {
    try {
      setLoadingMore(true);
      const res = await getDevotionals(p, 20); // fetch 20 per page
      if (p === 1) {
        setLatestData(res.data);
      } else {
        setLatestData((prev) => [...prev, ...res.data]);
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

  /** --------- Initial load --------- */
  useEffect(() => {
    loadPage(1); // load first page
    (async () => {
      const ids = await getFavedIds();
      setFavIds(ids);
    })();
  }, []);

  /** --------- Update favourites whenever ids or latestData changes --------- */
  useEffect(() => {
    const faved = latestData.filter((d) => favIds.includes(d.id));
    setFavData(faved);
  }, [latestData, favIds]);

  /** --------- Toggle favourite handler --------- */
  const handleToggleFave = async (id: number) => {
    const updated = await toggleFave(id);
    setFavIds(updated);
  };

  /** --------- Search filtering --------- */
  const latestFiltered = useMemo(() => {
    return qLatest.trim()
      ? latestData.filter(
          (d) => d.id.toString().includes(qLatest) // later: filter by title if backend provides
        )
      : latestData;
  }, [qLatest, latestData]);

  const favFiltered = useMemo(() => {
    return qFav.trim()
      ? favData.filter((d) => d.id.toString().includes(qFav))
      : favData;
  }, [qFav, favData]);

  /** --------- Pager underline animation --------- */
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
        rightIcons={[
          {
            name: "download-outline",
            hasNotification: false,
            onPress: () => {},
          },
        ]}
      />

      {/* Tabs */}
      <View
        style={[styles.tabsRow, { borderBottomColor: colors.subtitle }]}
        onLayout={(e) => setTabsW(e.nativeEvent.layout.width - 28)}
      >
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => goTo("Latest")}
          activeOpacity={0.7}
        >
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
          activeOpacity={0.7}
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
        ref={(r) => {
          pagerRef.current = r;
        }}
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
        {/* Latest (paginated) */}
        <View style={{ width }}>
          <DevoImagesGrid
            query={qLatest}
            setQuery={setQLatest}
            data={latestFiltered}
            favIds={favIds}
            onToggleFave={handleToggleFave}
            onEndReached={handleLoadMore}
            loadingMore={loadingMore}
            refreshing={refreshing} // ✅
            onRefresh={handleRefresh} // ✅
            onPressItem={(item) =>
              router.push({
                pathname: "/devotional/[id]",
                params: { id: String(item.id) },
              })
            }
          />
        </View>

        {/* Favourites (local, no pagination) */}
        <View style={{ width }}>
          <DevoImagesGrid
            query={qFav}
            setQuery={setQFav}
            data={favFiltered}
            favIds={favIds}
            onToggleFave={handleToggleFave}
            // ❌ no onEndReached for local favourites
            loadingMore={false}
          />
        </View>
      </Animated.ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabText: { fontSize: 14, fontWeight: "700" },
  movingUnderline: {
    position: "absolute",
    bottom: -1,
    left: 14,
    height: 3,
    borderRadius: 2,
  },
});
