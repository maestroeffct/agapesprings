import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type TabKey = "Web" | "TV" | "Radio";

export default function Platforms() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef<ScrollView>(null);

  const tabs: TabKey[] = ["Web", "TV", "Radio"];
  const [tab, setTab] = useState<TabKey>("Web");

  const webLinks = [
    {
      label: "Agapesprings Live",
      url: "https://live.agapesprings.org",
      icon: "tv-outline",
    },
    {
      label: "Agapesprings Radio",
      url: "https://agapesprings.org/radio",
      icon: "radio-outline",
    },
    {
      label: "YouTube",
      url: "https://youtube.com/@agapespringsint",
      icon: "logo-youtube",
    },
    {
      label: "Facebook",
      url: "https://www.facebook.com/agapespringsint",
      icon: "logo-facebook",
    },
    {
      label: "Instagram",
      url: "https://www.instagram.com/agapesprings_global",
      icon: "logo-instagram",
    },
    {
      label: "Mixlr",
      url: "http://www.mixlr.com/agapespringsint",
      icon: "logo-mixlr",
    },
  ];

  const radioLinks = [
    {
      label: "Spirit FM - 96.6",
      subtitle: "Mon (Luganda) 7–8pm, Fri 9–10pm EAT",
    },
    { label: "Impact FM - 103.7 (Masaka)", subtitle: "Tue 7–8pm EAT" },
    { label: "K-Town Radio - 103.7 (Kabale)", subtitle: "Mon–Fri 7–8pm EAT" },
    {
      label: "Life FM - 93.8",
      subtitle: "Sat Rhythms of Grace, Mon–Fri 6:45–6:50am EAT",
    },
    { label: "MMU - 105.2 (Fort Portal)", subtitle: "Everyday 6:50am EAT" },
    {
      label: "Voice of Toro - 101.0 (Fort Portal)",
      subtitle: "Everyday 9–10am EAT",
    },
    { label: "Spice FM - 89.9 (Hoima)", subtitle: "Everyday 7:30–8:00am EAT" },
  ];

  // underline animation
  const underlineTranslateX = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: [0, width / 3, (width / 3) * 2], // 3 tabs
    extrapolate: "clamp",
  });

  const goToTab = (index: number) => {
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
    setTab(tabs[index]);
  };

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      statusBarColor={colors.background}
      barStyle={
        colors.background === "#111827" ? "light-content" : "dark-content"
      }
    >
      <TopBar
        title="Platforms"
        leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
      />

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.subtitle }]}>
        {tabs.map((t, idx) => (
          <TouchableOpacity
            key={t}
            style={styles.tabBtn}
            onPress={() => goToTab(idx)}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === t ? colors.primary : colors.subtitle },
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}

        <Animated.View
          style={[
            styles.tabUnderline,
            {
              backgroundColor: colors.primary,
              transform: [{ translateX: underlineTranslateX }],
            },
          ]}
        />
      </View>

      {/* Pager */}
      <Animated.ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setTab(tabs[idx]);
        }}
      >
        {/* Web */}
        <ScrollView style={{ width }}>
          {webLinks.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.item}
              onPress={() => Linking.openURL(item.url)}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={colors.primary}
                />
                <View>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.url, { color: colors.subtitle }]}>
                    {item.url}
                  </Text>
                </View>
              </View>
              <Ionicons name="link-outline" size={20} color={colors.subtitle} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TV */}
        <ScrollView style={{ width, padding: 20 }}>
          <Text style={{ color: colors.subtitle }}>
            TV platforms coming soon…
          </Text>
        </ScrollView>

        {/* Radio */}
        <ScrollView style={{ width }}>
          {radioLinks.map((item, idx) => (
            <View key={idx} style={styles.item}>
              <View style={styles.itemLeft}>
                <Ionicons
                  name="radio-outline"
                  size={24}
                  color={colors.primary}
                />
                <View>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.url, { color: colors.subtitle }]}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    position: "relative",
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: "700" },
  tabUnderline: {
    position: "absolute",
    bottom: -1, // sits exactly on border
    left: 0,
    width: "33.33%", // one-third for 3 tabs
    height: 2,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: { flexDirection: "row", gap: 12, alignItems: "center" },
  label: { fontSize: 15, fontWeight: "600" },
  url: { fontSize: 12 },
});
