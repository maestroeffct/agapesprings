import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useNotifications } from "@/store/NotificationContext";
import { useTheme } from "@/store/ThemeContext";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

export default function NotificationsScreen() {
  const { notifications, reload } = useNotifications();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const goToTarget = (target?: string) => {
    if (!target) {
      router.push("/notifications");
      return;
    }
    const route =
      target === "devotional"
        ? "/(drawer)/(tabs)/devotional"
        : target === "onesound"
        ? "/(drawer)/(tabs)/livingtv"
        : target === "audioSermon"
        ? "/(drawer)/(tabs)/livingwaters"
        : target === "location"
        ? "/(drawer)/locator"
        : target === "carousel"
        ? "/"
        : "/notifications";
    router.push(route as any);
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await reload?.(); // ✅ If hook exposes reload, trigger it
    } catch (err) {
      console.warn("Failed to refresh notifications:", err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      statusBarColor={colors.background}
      barStyle={isDark ? "light-content" : "dark-content"}
    >
      <TopBar
        title="Updates"
        leftIcons={[
          {
            name: "arrow-back",
            onPress: () => router.back(),
            color: colors.text,
          },
        ]}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{
          backgroundColor: colors.background,
          paddingBottom: 16,
        }}
        renderItem={({ item }) => {
          // 🖼 Normalize image URL
          const imageUrl =
            item.imageUrl && item.imageUrl.startsWith("http")
              ? item.imageUrl
              : item.imageUrl
              ? `https://api.agapespringsint.com${item.imageUrl}`
              : null;

          return (
            <TouchableOpacity
              style={[
                styles.item,
                { borderBottomColor: colors.border || colors.subtitle },
              ]}
              activeOpacity={0.8}
              onPress={() => goToTarget(item.targetUrl)}
            >
              <Image
                source={
                  imageUrl
                    ? { uri: imageUrl }
                    : require("@/assets/images/flow1.png")
                }
                style={styles.thumb}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
              />

              <View style={styles.textBlock}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {item.title}
                </Text>

                {item.message && (
                  <Text
                    style={[styles.excerpt, { color: colors.subtitle }]}
                    numberOfLines={2}
                  >
                    {item.message}
                  </Text>
                )}

                <Text style={[styles.date, { color: colors.subtitle }]}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subtitle }]}>
              No new notifications
            </Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#ccc",
  },
  textBlock: { flex: 1 },
  title: { fontWeight: "600", fontSize: 14, marginBottom: 2 },
  excerpt: { fontSize: 12, marginBottom: 2, lineHeight: 16 },
  date: { fontSize: 11 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: { fontSize: 13, fontWeight: "500" },
});
