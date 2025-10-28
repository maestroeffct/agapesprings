import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useTheme } from "@/store/ThemeContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as FileSystem from "expo-file-system";

const DOWNLOADS_FILE = FileSystem.documentDirectory + "downloads.json";

type DownloadedDevotional = {
  id: number;
  images: string[];
  timestamp: number;
};

async function getDownloadedDevotionals(): Promise<DownloadedDevotional[]> {
  try {
    const raw = await FileSystem.readAsStringAsync(DOWNLOADS_FILE);
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default function DevotionalDownloads() {
  const { colors } = useTheme();
  const router = useRouter();

  const [downloads, setDownloads] = useState<DownloadedDevotional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const items = await getDownloadedDevotionals();
      setDownloads(items);
      setLoading(false);
    })();
  }, []);

  // Navigate to lightbox/detail screen to preview images
  const openDevotional = (devo: DownloadedDevotional) => {
    router.push({
      pathname: "/devotional/dd",
      params: { id: String(devo.id) },
    });
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Loading size={40} />
        </View>
      </ScreenWrapper>
    );
  }

  if (downloads.length === 0) {
    return (
      <ScreenWrapper style={{ backgroundColor: colors.background }}>
        <TopBar
          title="Devotionals Downloads"
          leftIcons={[
            { name: "chevron-back-outline", onPress: () => router.back() },
          ]}
        />
        <View style={styles.center}>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            No devotional downloads yet.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      <TopBar
        title="Downloaded Devotionals"
        leftIcons={[
          { name: "chevron-back-outline", onPress: () => router.back() },
        ]}
      />

      <FlatList
        data={downloads}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openDevotional(item)}
            style={[styles.item, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.title, { color: colors.text }]}>
              Devotional {item.id}
            </Text>
            <Text style={[styles.timestamp, { color: colors.text }]}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>

            <FlatList
              horizontal
              data={item.images}
              keyExtractor={(_, idx) => idx.toString()}
              renderItem={({ item: imgUri }) => (
                <Image source={{ uri: imgUri }} style={styles.thumbnail} />
              )}
              contentContainerStyle={{ marginTop: 8 }}
            />
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  item: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  timestamp: { fontSize: 12, fontWeight: "400", opacity: 0.6 },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 8,
  },
});
