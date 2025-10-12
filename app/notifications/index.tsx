// app/notifications/index.tsx
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useNotifications } from "@/store/NotificationContext";
import { router } from "expo-router";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NotificationsScreen() {
  const { notifications } = useNotifications();

  return (
    <ScreenWrapper>
      <TopBar
        title="Updates"
        leftIcons={[
          { name: "arrow-back", onPress: () => router.back(), color: "#000" },
        ]}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
            ) : (
              <Image
                source={require("@/assets/images/aud1.png")}
                style={styles.thumb}
              />
            )}
            <View style={styles.textBlock}>
              <Text style={styles.title}>{item.title}</Text>
              {item.message && (
                <Text style={styles.excerpt}>{item.message}</Text>
              )}
              <Text style={styles.date}>{item.createdAt}</Text>
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
