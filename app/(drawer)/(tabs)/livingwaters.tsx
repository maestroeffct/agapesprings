import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

// Tab pages
import AudioTab from "@/components/AudioTab";
import CategoriesTab from "@/components/CategoriesTab";
import OneSound from "@/components/OneSound";
import VideoTab from "@/components/VideoTab";

import { useTheme } from "@/store/ThemeContext";
import { router } from "expo-router";

const topTabs = ["Video", "Audio", "Categories", "OneSound Music"] as const;
type TopTab = (typeof topTabs)[number];

const UNDERLINE_H = 3;

export default function LivingWatersScreen() {
  const { colors, isDark } = useTheme();
  const [selectedTab, setSelectedTab] = useState<TopTab>("Video");
  const [query, setQuery] = useState("");
  const { width } = useWindowDimensions();

  const pagerRef = useRef<FlatList<TopTab> | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // measure per tab (container + label widths)
  const [tabBoxes, setTabBoxes] = useState<{ x: number; w: number }[]>(
    Array(topTabs.length).fill({ x: 0, w: 0 })
  );
  const [labelWidths, setLabelWidths] = useState<
    Partial<Record<TopTab, number>>
  >({});

  const indexFromTab = (t: TopTab) => topTabs.indexOf(t);
  const tabFromIndex = (i: number) =>
    topTabs[Math.max(0, Math.min(i, topTabs.length - 1))];

  const handleTabPress = (t: TopTab) => {
    setSelectedTab(t);
    pagerRef.current?.scrollToIndex({
      index: indexFromTab(t),
      animated: true,
    });
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setSelectedTab(tabFromIndex(i));
  };

  // underline math (stretchy)
  const ready = topTabs.every(
    (t, i) => tabBoxes[i]?.w > 0 && (labelWidths[t] ?? 0) > 0
  );

  const labelLefts = ready
    ? topTabs.map((t, i) => {
        const labelW = labelWidths[t] as number;
        const { x, w } = tabBoxes[i];
        return x + (w - labelW) / 2;
      })
    : [];

  const labelRights = ready
    ? topTabs.map((t, i) => {
        const labelW = labelWidths[t] as number;
        return labelLefts[i] + labelW;
      })
    : [];

  const stretchInput: number[] = [];
  const stretchLeftOut: number[] = [];
  const stretchWidthOut: number[] = [];

  if (ready) {
    for (let i = 0; i < topTabs.length; i++) {
      stretchInput.push(i * width);
      stretchLeftOut.push(labelLefts[i]);
      stretchWidthOut.push((labelWidths[topTabs[i]] as number) || 28);

      if (i < topTabs.length - 1) {
        stretchInput.push((i + 0.5) * width);
        stretchLeftOut.push(labelLefts[i]);
        const stretchedWidth = labelRights[i + 1] - labelLefts[i];
        stretchWidthOut.push(stretchedWidth);
      }
    }
  }

  const underlineLeft = ready
    ? scrollX.interpolate({
        inputRange: stretchInput,
        outputRange: stretchLeftOut,
        extrapolate: "clamp",
      })
    : 0;

  const underlineWidth = ready
    ? scrollX.interpolate({
        inputRange: stretchInput,
        outputRange: stretchWidthOut,
        extrapolate: "clamp",
      })
    : 0;

  // theme-derived colors
  const BORDER = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const INACTIVE = colors.subtitle; // dim label
  const ACTIVE = colors.primary; // active label + underline

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      statusBarColor={colors.background}
      barStyle={isDark ? "light-content" : "dark-content"}
    >
      <Header
        rightIcons={[
          {
            name: "download-outline",
            hasNotification: false,
            onPress: () => router.push("/downloads"),
          },
        ]}
      />

      {/* Tabs */}
      <View
        style={[
          styles.tabsRow,
          { borderBottomColor: BORDER, backgroundColor: colors.background },
        ]}
      >
        {topTabs.map((t, i) => {
          // animated color to follow swipe
          const perTabInput = topTabs.map((_, j) => j * width);
          const activeAnim = scrollX.interpolate({
            inputRange: perTabInput,
            outputRange: topTabs.map((_, j) => (j === i ? 1 : 0)),
            extrapolate: "clamp",
          });
          const color = activeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [INACTIVE, ACTIVE],
          });

          return (
            <TouchableOpacity
              key={t}
              onPress={() => handleTabPress(t)}
              style={[
                styles.tabBtn,
                i < topTabs.length - 1 && { marginRight: 16 },
              ]}
              activeOpacity={0.8}
              onLayout={(e) => {
                const { x, width: w } = e.nativeEvent.layout;
                setTabBoxes((prev) => {
                  const next = [...prev];
                  next[i] = { x, w };
                  return next;
                });
              }}
            >
              <Animated.Text
                style={[styles.tabText, { color }]}
                numberOfLines={1}
                onLayout={(e) => {
                  const w = e.nativeEvent.layout.width;
                  setLabelWidths((prev) =>
                    prev?.[t] === w ? prev : { ...prev, [t]: w }
                  );
                }}
              >
                {t}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}

        {/* Stretchy underline */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeUnderline,
            { backgroundColor: ACTIVE },
            ready ? { left: underlineLeft, width: underlineWidth } : null,
          ]}
        />
      </View>

      {/* Pager */}

      <Animated.FlatList
        ref={pagerRef}
        data={topTabs}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          switch (item) {
            case "Video":
              return (
                <View style={[styles.page, { width }]}>
                  <VideoTab query={query} onChangeQuery={setQuery} />
                </View>
              );
            case "Audio":
              return (
                <View style={[styles.page, { width }]}>
                  <AudioTab />
                </View>
              );
            case "Categories":
              return (
                <View style={[styles.page, { width }]}>
                  <CategoriesTab
                    onSelect={(cat) => console.log("Open:", cat.title)}
                  />
                </View>
              );
            case "OneSound Music":
              return (
                <View style={[styles.page, { width }]}>
                  <OneSound />
                </View>
              );
          }
        }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setSelectedTab(tabFromIndex(i));
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingBottom: UNDERLINE_H + 6,
    justifyContent: "flex-start",
  },
  tabBtn: { alignItems: "center", paddingHorizontal: 6 },
  tabText: { fontSize: 14, fontWeight: "600" },

  activeUnderline: {
    position: "absolute",
    bottom: -1,
    height: UNDERLINE_H,
    borderRadius: 2,
  },

  page: { paddingHorizontal: 14, paddingTop: 10 },
});
