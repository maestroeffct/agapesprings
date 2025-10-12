// app/(tabs)/onesound.tsx
import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PLACEHOLDER = require("@/assets/images/aud1.png"); // 🎵 placeholder image

type Song = {
  id: string;
  title: string;
  artist: string;
  thumb?: string;
};

const dummySongs: Song[] = [
  {
    id: "1",
    title: "You Are Great",
    artist: "Agape Choir",
    thumb: "https://picsum.photos/200/200?1",
  },
  {
    id: "2",
    title: "Holy Spirit Fire",
    artist: "Agape Voices",
    thumb: "https://picsum.photos/200/200?2",
  },
  {
    id: "3",
    title: "Living Waters Flow",
    artist: "Praise Team",
    thumb: "https://picsum.photos/200/200?3",
  },
];

export default function OneSoundScreen() {
  const { colors, isDark } = useTheme();
  const [songs] = useState<Song[]>(dummySongs);

  const renderItem = ({ item }: { item: Song }) => (
    <View style={styles.row}>
      <ExpoImage
        source={item.thumb ? { uri: item.thumb } : PLACEHOLDER}
        placeholder={PLACEHOLDER}
        style={styles.thumb}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text
          style={[styles.artist, { color: colors.subtitle }]}
          numberOfLines={1}
        >
          {item.artist}
        </Text>
      </View>
      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons
            name="play-circle-outline"
            size={26}
            color={colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons
            name="download-outline"
            size={22}
            color={colors.subtitle}
            style={{ marginLeft: 12 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      statusBarColor={colors.background}
      barStyle={isDark ? "light-content" : "dark-content"}
    >
      <Header
        title="OneSound"
        rightIcons={[
          {
            name: "download-outline",
            hasNotification: false,
            onPress: () => console.log("Go to downloads"),
          },
        ]}
      />

      {songs.length > 0 ? (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12 }}
          ItemSeparatorComponent={() => (
            <View
              style={[
                styles.separator,
                { backgroundColor: colors.subtitle },
              ]}
            />
          )}
        />
      ) : (
        <View style={styles.center}>
          <Ionicons
            name="musical-notes-outline"
            size={42}
            color={colors.subtitle}
          />
          <Text style={[styles.empty, { color: colors.subtitle }]}>
            No songs yet
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: "#ccc",
  },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600" },
  artist: { fontSize: 13, marginTop: 2 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  empty: { fontSize: 14, fontWeight: "500" },
});
