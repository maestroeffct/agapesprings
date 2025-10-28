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

type TabKey = "Web" | "Radio" | "TV";

export default function Platforms() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef<ScrollView>(null);

  const tabs: TabKey[] = ["Web", "Radio", "TV"];
  const [tab, setTab] = useState<TabKey>("Web");

  const webLinks = [
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
  ];

  const radioLink = "https://adaba889.fm/";

  const radioLinks = [
    {
      label: "Adaba FM - 88.9",
      schedule: [
        { day: "Wednesday", time: "2:30 PM WAT" },
        { day: "Friday", time: "4:00 PM WAT" },
        { day: "Saturday", time: "4:00 PM WAT" },
      ],
    },
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

        {/* Radio */}
        <ScrollView style={{ width, padding: 20 }}>
          {radioLinks.map((station, idx) => (
            <View key={idx} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="radio-outline"
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[styles.label, { color: colors.text, fontSize: 16 }]}
                >
                  {station.label}
                </Text>
              </View>

              <View style={{ marginTop: 8, paddingLeft: 32 }}>
                {station.schedule.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => Linking.openURL(radioLink)}
                    activeOpacity={0.6}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 6,
                      paddingLeft: 8,
                    }}
                  >
                    <Text
                      style={[styles.bulletText, { color: colors.subtitle }]}
                    >
                      • {item.day}
                    </Text>

                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={[
                          styles.bulletText,
                          { color: colors.subtitle, marginRight: 37 },
                        ]} // increase spacing
                      >
                        {item.time}
                      </Text>
                      <Text
                        style={{
                          color: colors.primary,
                          textDecorationLine: "underline",
                          marginLeft: 8, // optional extra spacing if needed
                        }}
                      >
                        Listen Live
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* TV */}
        <ScrollView style={{ width, padding: 20 }}>
          <Text style={{ color: colors.subtitle }}>
            TV platforms coming soon…
          </Text>
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
    bottom: -1,
    left: 0,
    width: "33.33%", // 3 tabs
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
  bulletText: { fontSize: 13, marginBottom: 6 },
});
