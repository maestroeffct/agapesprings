import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Image as ExpoImage } from "expo-image";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { useTheme } from "@/store/ThemeContext";
import { router } from "expo-router";

const PLACEHOLDER = require("@/assets/images/aud_default.jpeg");

type Song = {
  id: number;
  title: string;
  artist?: string;
  lyrics?: string;
  audioUrl?: string;
  coverUrl?: string;
  localUri: string;
};

export default function OnesoundDownloadScreen() {
  const { colors, isDark } = useTheme();
  const { play, current, isPlaying } = useAudioPlayer();
  const [downloads, setDownloads] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔹 Load and validate downloads
  const loadDownloads = useCallback(async () => {
    try {
      setRefreshing(true);
      const stored = await AsyncStorage.getItem("downloads");
      let parsed: Song[] = stored ? JSON.parse(stored) : [];

      // ✅ Filter out non-existing or invalid files
      const validated: Song[] = [];
      for (const s of parsed) {
        const uri = s.localUri?.startsWith("file://")
          ? s.localUri
          : `file://${s.localUri}`;
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists) validated.push({ ...s, localUri: uri });
      }

      setDownloads(validated);
      await AsyncStorage.setItem("downloads", JSON.stringify(validated));
    } catch (err) {
      console.error("❌ Failed to load downloads:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  // 🎧 Play locally downloaded song
  const handlePlay = async (song: Song) => {
    try {
      if (!song.localUri) {
        Alert.alert("File missing", "This song file could not be found.");
        return;
      }

      const uri = song.localUri.startsWith("file://")
        ? song.localUri
        : `file://${song.localUri}`;

      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) {
        Alert.alert("Missing file", "This downloaded file no longer exists.");
        await loadDownloads();
        return;
      }

      const audioItem = {
        id: song.id,
        title: song.title,
        author: song.artist || "Unknown Artist",
        streamUrl: uri, // ✅ guaranteed valid local URI
        thumb: song.coverUrl ? { uri: song.coverUrl } : PLACEHOLDER,
        lyrics: song.lyrics || "",
        sourceLabel: "Offline",
      };

      // Queue must contain valid URIs only
      const queue = downloads
        .filter((d) => d.localUri && d.localUri.startsWith("file://"))
        .map((d) => ({
          id: d.id,
          title: d.title,
          author: d.artist || "Unknown Artist",
          streamUrl: d.localUri,
          thumb: d.coverUrl ? { uri: d.coverUrl } : PLACEHOLDER,
          lyrics: d.lyrics || "",
          sourceLabel: "Offline",
        }));

      await play(audioItem, queue);
      router.push("/audio-player");
    } catch (err) {
      console.error("❌ Failed to play local file:", err);
      Alert.alert("Playback error", "Could not play this song.");
    }
  };

  // 🗑 Delete download
  const handleDelete = async (song: Song) => {
    Alert.alert("Remove Download", `Delete "${song.title}" from your device?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const info = await FileSystem.getInfoAsync(song.localUri);
            if (info.exists)
              await FileSystem.deleteAsync(song.localUri, { idempotent: true });

            const updated = downloads.filter((d) => d.id !== song.id);
            setDownloads(updated);
            await AsyncStorage.setItem("downloads", JSON.stringify(updated));
          } catch (err) {
            console.error("❌ Error deleting file:", err);
            Alert.alert("Error", "Failed to delete file.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Song }) => {
    const isCurrent = current?.id === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: isCurrent ? colors.card + "33" : "transparent" },
        ]}
        activeOpacity={0.8}
        onPress={() => handlePlay(item)}
      >
        <ExpoImage
          source={item.coverUrl ? { uri: item.coverUrl } : PLACEHOLDER}
          placeholder={PLACEHOLDER}
          style={styles.thumb}
          contentFit="cover"
        />

        <View style={styles.info}>
          <Text
            style={[
              styles.title,
              { color: isCurrent ? colors.primary : colors.text },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.artist, { color: colors.subtitle }]}
            numberOfLines={1}
          >
            {item.artist || "Unknown Artist"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handlePlay(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                isCurrent && isPlaying
                  ? "pause-circle-outline"
                  : "play-circle-outline"
              }
              size={26}
              color={isCurrent ? colors.primary : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={colors.subtitle}
              style={{ marginLeft: 14 }}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      statusBarColor={colors.background}
      barStyle={isDark ? "light-content" : "dark-content"}
    >
      <TopBar
        title="Onesound Downloads"
        leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : downloads.length > 0 ? (
        <FlatList
          data={downloads}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadDownloads}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ItemSeparatorComponent={() => (
            <View
              style={[
                styles.separator,
                { backgroundColor: colors.border ?? colors.subtitle },
              ]}
            />
          )}
        />
      ) : (
        <View style={styles.center}>
          <Ionicons
            name="folder-open-outline"
            size={48}
            color={colors.subtitle}
          />
          <Text style={[styles.empty, { color: colors.subtitle }]}>
            No songs downloaded yet
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
    borderRadius: 10,
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
  actions: { flexDirection: "row", alignItems: "center" },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  empty: { fontSize: 14, fontWeight: "500" },
});
