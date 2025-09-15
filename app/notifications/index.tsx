// app/notifications/index.tsx
import { getNotifications, NotificationItem } from "@/api/notifications";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useTheme } from "@/store/ThemeContext";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err: any) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <ScreenWrapper>
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

      {loading && !refreshing && <Loading size="large" />}
      {error && !loading && (
        <Text style={{ color: "red", padding: 16 }}>{error}</Text>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => console.log("Tapped:", item.title)}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.thumb} />
            ) : (
              <Image
                source={require("@/assets/images/aud1.png")}
                style={styles.thumb}
              />
            )}
            <View style={styles.textBlock}>
              <Text style={[styles.title, { color: colors.text }]}>
                {item.title}
              </Text>
              {item.excerpt ? (
                <Text style={styles.excerpt} numberOfLines={2}>
                  {item.excerpt}
                </Text>
              ) : null}
              <Text style={styles.date}>{item.date}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  thumb: { width: 60, height: 60, borderRadius: 6, marginRight: 12 },
  textBlock: { flex: 1 },
  title: { fontWeight: "600", fontSize: 14, marginBottom: 2 },
  excerpt: { fontSize: 12, color: "#666", marginBottom: 2 },
  date: { fontSize: 11, color: "#999" },
});
