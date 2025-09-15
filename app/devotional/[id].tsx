import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Devotional, getDevotionalById } from "@/api/devotional";
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useTheme } from "@/store/ThemeContext";
import { getFavedIds, toggleFave } from "@/store/devotionalFaves"; // ✅

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
        const res = await getDevotionalById(Number(id));
        setDevo(res);

        const ids = await getFavedIds();
        setIsFav(ids.includes(Number(id)));
      } catch (err) {
        console.error("Failed to load devotional", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleToggleFave = async () => {
    if (!id) return;
    const updated = await toggleFave(Number(id));
    setIsFav(updated.includes(Number(id)));
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Loading...</Text>
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

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      statusBarColor={colors.background}
      barStyle={
        colors.background === "#111827" ? "light-content" : "dark-content"
      }
    >
      <TopBar
        title={`Devotional ${devo.id}`}
        leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
        rightIcons={[
          {
            name: isFav ? "heart" : "heart-outline",
            onPress: handleToggleFave,
            color: isFav ? "red" : colors.text,
          },
          {
            name: "share-outline",
            onPress: () => console.log("Share pressed"),
          },
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
  scrollContent: {
    // padding: ,
    alignItems: "center",
  },
  headerImg: {
    width: "100%",
    height: undefined,
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 8,
  },
  contentImg: {
    width: "100%",
    height: undefined,
    aspectRatio: 1,
    marginBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
