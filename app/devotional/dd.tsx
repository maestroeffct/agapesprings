import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useTheme } from "@/store/ThemeContext";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ImageViewing from "react-native-image-viewing";

const DOWNLOADS_FILE = FileSystem.documentDirectory + "downloads.json";

type DownloadedDevotional = {
  id: number;
  images: string[];
  timestamp: number;
};

async function getDownloadedDevotional(
  id: number
): Promise<DownloadedDevotional | null> {
  try {
    const raw = await FileSystem.readAsStringAsync(DOWNLOADS_FILE);
    const downloads: DownloadedDevotional[] = JSON.parse(raw);
    return downloads.find((d) => d.id === id) || null;
  } catch {
    return null;
  }
}

export default function DownloadedDevotionalViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const devoId = Number(id);
  const { colors } = useTheme();
  const router = useRouter();

  const [devo, setDevo] = useState<DownloadedDevotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true); // control ImageViewing visibility
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const item = await getDownloadedDevotional(devoId);
      setDevo(item);
      setLoading(false);
    })();
  }, [devoId]);

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Loading size={40} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!devo) {
    return (
      <ScreenWrapper>
        <TopBar
          title={`Devotional ${devoId}`}
          leftIcons={[
            { name: "chevron-back-outline", onPress: () => router.back() },
          ]}
        />
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>
            Downloaded devotional not found.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      <TopBar
        title={`Devotional ${devo.id}`}
        leftIcons={[
          { name: "chevron-back-outline", onPress: () => router.back() },
        ]}
      />

      <ImageViewing
        images={devo.images.map((uri) => ({ uri }))}
        imageIndex={currentIndex}
        visible={visible}
        onRequestClose={() => router.back()}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
