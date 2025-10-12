import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Devotional, getDevotionalById } from "@/api/devotional";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useTheme } from "@/store/ThemeContext";
import {
  getCachedDevotionals,
  saveDevotionalToCache,
} from "@/store/devotionalCache";
import { getFavedIds, toggleFave } from "@/store/devotionalFaves";
import * as FileSystem from "expo-file-system";

export default function DevotionalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const [devo, setDevo] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const devoId = Number(id);

        const cached = await getCachedDevotionals();
        let local = cached.find((d) => d.id === devoId);

        if (local) {
          setDevo(local);
        } else {
          const res = await getDevotionalById(devoId);
          console.log(
            "🧠 Raw API devotional response:",
            JSON.stringify(res, null, 2)
          );

          if (res) {
            // 🧩 Normalize the content field
            let parsedContent: string[] = [];
            if (typeof res.content === "string") {
              try {
                const maybeArray = JSON.parse(res.content);
                if (Array.isArray(maybeArray)) parsedContent = maybeArray;
                else if (typeof maybeArray === "string")
                  parsedContent = [maybeArray];
              } catch {
                const urls = res.content.match(
                  /https?:\/\/\S+\.(?:jpg|jpeg|png|gif)/g
                );
                parsedContent = urls || [];
              }
            } else if (Array.isArray(res.content)) {
              parsedContent = res.content;
            }

            const normalized = { ...res, content: parsedContent };
            setDevo(normalized);
            await saveDevotionalToCache(normalized);
          }
        }

        const ids = await getFavedIds();
        setIsFav(ids.includes(devoId));
      } catch (err) {
        console.error("Failed to load devotional", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleToggleFave = async () => {
    if (!id || !devo) return;

    setIsFav((prev) => !prev); // optimistic UI

    try {
      // ✅ Pass the full devo so it gets saved in AsyncStorage
      const updated = await toggleFave(Number(id), devo);
      setIsFav(updated.includes(Number(id)));
    } catch (err) {
      console.error("Failed to toggle fave", err);
    }
  };

  const handleDownload = async () => {
    if (!devo) return;
    try {
      const allImages = [devo.headerUrl, ...(devo.content || [])].filter(
        Boolean
      );
      if (allImages.length === 0) {
        Alert.alert("No images", "This devotional has no images to download.");
        return;
      }
      const savedFiles: string[] = [];
      for (let i = 0; i < allImages.length; i++) {
        const url = allImages[i];
        const fileUri =
          FileSystem.documentDirectory + `devotional-${devo.id}-${i + 1}.jpg`;
        const { uri } = await FileSystem.downloadAsync(url, fileUri);
        savedFiles.push(uri);
      }
      Alert.alert("Downloaded", `Saved ${savedFiles.length} images`);
    } catch (err) {
      console.error("Download failed:", err);
      Alert.alert("Error", "Failed to download devotional.");
    }
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

  if (!devo) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Devotional not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // 👇 Add this log here, right before return
  console.log("Devotional content:", devo.content);

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      <TopBar
        title={`Devotional ${devo.id}`}
        leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
        rightIcons={[
          {
            name: isFav ? "heart" : "heart-outline",
            onPress: handleToggleFave,
            color: isFav ? "red" : colors.text,
          },
          { name: "download-outline", onPress: handleDownload },
        ]}
        rightGap={10}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={{ uri: devo.headerUrl }}
          style={styles.headerImg}
          resizeMode="contain"
        />
        {devo.content?.map((url, idx) => (
          <Image
            key={idx}
            source={{ uri: url }}
            style={styles.contentImg}
            resizeMode="contain"
          />
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { alignItems: "center", paddingBottom: 24 },
  headerImg: {
    width: "100%",
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 8,
  },
  contentImg: { width: "100%", aspectRatio: 1, marginBottom: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
