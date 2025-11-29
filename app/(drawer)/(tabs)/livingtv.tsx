import { getOneSoundFiles } from "@/api/onesound";
import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import SearchFilterBar from "@/components/SearchFilterButtons";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Image as ExpoImage } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PLACEHOLDER = require("@/assets/images/aud_default.jpeg");

type Song = {
  id: number;
  title: string;
  artist?: string;
  lyrics?: string;
  audioUrl: string;
  coverUrl?: string;
  localUri?: string;
};

export default function OneSoundScreen() {
  const normalizeTitle = (title?: string) => title?.trim() || "";

  const { colors, isDark } = useTheme();
  const { play, current, isPlaying } = useAudioPlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [downloaded, setDownloaded] = useState<Record<number, string>>({});
  const [downloading, setDownloading] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  // 🔹 Load downloaded items from AsyncStorage
  const loadDownloads = useCallback(async () => {
    try {
      const saved = JSON.parse(
        (await AsyncStorage.getItem("downloads")) || "[]"
      );
      const map: Record<number, string> = {};
      saved.forEach((d: Song) => {
        if (d.localUri) map[d.id] = d.localUri;
      });
      setDownloaded(map);
    } catch (err) {
      console.warn("⚠️ Failed to load downloads:", err);
    }
  }, []);

  // 🔹 Fetch songs from API
  const fetchSongs = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await getOneSoundFiles(1, 50);
      const sorted = (data || []).sort((a, b) =>
        normalizeTitle(a.title)
          .toLowerCase()
          .localeCompare(normalizeTitle(b.title).toLowerCase())
      );
      setSongs(sorted);
      await loadDownloads();
    } catch (err) {
      console.error("❌ Failed to fetch OneSound:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadDownloads]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  // 🔹 Filter + sort results
  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? songs.filter(
          (s) =>
            normalizeTitle(s.title).toLowerCase().includes(q) ||
            s.artist?.toLowerCase().includes(q)
        )
      : songs;
    return [...list].sort((a, b) =>
      normalizeTitle(a.title)
        .toLowerCase()
        .localeCompare(normalizeTitle(b.title).toLowerCase())
    );
  }, [songs, query]);

  // 🔹 Save download record locally
  const saveDownloadRecord = async (song: Song, uri: string) => {
    try {
      const existing = JSON.parse(
        (await AsyncStorage.getItem("downloads")) || "[]"
      );
      const updated = [
        ...existing.filter((x: Song) => x.id !== song.id),
        { ...song, localUri: uri },
      ];
      await AsyncStorage.setItem("downloads", JSON.stringify(updated));
      await loadDownloads(); // refresh UI
    } catch (err) {
      console.warn("⚠️ Failed to save download record:", err);
    }
  };

  // 🔹 Handle safe download with progress + no crash
  const handleDownload = async (song: Song) => {
    if (downloaded[song.id]) return; // Already downloaded

    try {
      if (!song.audioUrl) {
        Alert.alert("No file", "This track has no audio file to download.");
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow storage access to download songs."
        );
        return;
      }

      let folderUri =
        Platform.OS === "android"
          ? `${FileSystem.documentDirectory}Music/OneSound/`
          : `${FileSystem.documentDirectory}OneSound/`;

      const folderInfo = await FileSystem.getInfoAsync(folderUri);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folderUri, { intermediates: true });
      }

      const safeTitle = normalizeTitle(song.title) || `song-${song.id}`;
      const cleanTitle =
        safeTitle.replace(/[^\w\s]/g, "_") || `song_${song.id}`;
      const fileUri = folderUri + `${cleanTitle}.mp3`;

      const downloadResumable = FileSystem.createDownloadResumable(
        song.audioUrl,
        fileUri,
        {},
        (progress) => {
          const pct =
            progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          setDownloading((prev) => ({ ...prev, [song.id]: pct }));
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) throw new Error("Download failed");

      // ✅ Save to library if possible (no album creation)
      try {
        await MediaLibrary.saveToLibraryAsync(result.uri);
      } catch (e) {
        console.log("Media save skipped:", e);
      }

      await saveDownloadRecord(song, result.uri);
      setDownloading((prev) => {
        const copy = { ...prev };
        delete copy[song.id];
        return copy;
      });

      Alert.alert("✅ Download Complete", `${song.title} saved successfully.`);
    } catch (err) {
      console.error("❌ Download failed:", err);
      Alert.alert("Error", "Could not download this song.");
      setDownloading((prev) => {
        const copy = { ...prev };
        delete copy[song.id];
        return copy;
      });
    }
  };

  // 🔹 Handle play (local if available)
  const handlePlay = async (song: Song) => {
    try {
      const local = downloaded[song.id];
      const audioItem = {
        id: song.id,
        title: song.title,
        author: song.artist || "Unknown Artist",
        streamUrl: local || song.audioUrl,
        thumb: song.coverUrl ? { uri: song.coverUrl } : PLACEHOLDER,
        lyrics: song.lyrics || "",
        sourceLabel: local ? "Offline" : "From OneSound",
      };

      const queue = filteredSongs.map((s) => ({
        id: s.id,
        title: s.title,
        author: s.artist || "Unknown Artist",
        streamUrl: downloaded[s.id] || s.audioUrl,
        thumb: s.coverUrl ? { uri: s.coverUrl } : PLACEHOLDER,
        lyrics: s.lyrics || "",
        sourceLabel: downloaded[s.id] ? "Offline" : "From OneSound",
      }));

      await play(audioItem, queue);
      router.push("/audio-player");
    } catch (error) {
      console.error("❌ Error playing track:", error);
    }
  };

  // 🔹 Render each song
  const renderItem = ({ item }: { item: Song }) => {
    const isCurrent = current?.id === item.id;
    const isDownloaded = !!downloaded[item.id];
    const progress = downloading[item.id] || 0;

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
          placeholderContentFit="cover"
          style={styles.thumb}
          contentFit="cover"
          transition={200}
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
          {/* ▶️ Play / Pause */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handlePlay(item)}
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

          {/* ⬇️ Download / Progress / Done */}
          {isDownloaded ? (
            <Ionicons
              name="checkmark-done-outline"
              size={22}
              color={colors.primary}
              style={{ marginLeft: 12 }}
            />
          ) : progress > 0 ? (
            <View style={{ marginLeft: 12, alignItems: "center" }}>
              <Text style={{ color: colors.primary, fontSize: 12 }}>
                {Math.floor(progress * 100)}%
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleDownload(item)}
            >
              <Ionicons
                name="download-outline"
                size={22}
                color={colors.subtitle}
                style={{ marginLeft: 12 }}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // 🔹 UI Layout
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
            onPress: () => router.push("/onesoundDownload"),
          },
        ]}
      />

      <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
        <SearchFilterBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search OneSound Musics..."
          showFilterButton
          onPressFilter={() => {}}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredSongs.length > 0 ? (
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12 }}
          ItemSeparatorComponent={() => (
            <View
              style={[
                styles.separator,
                { backgroundColor: colors.border ?? colors.subtitle },
              ]}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchSongs}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      ) : (
        <View style={styles.center}>
          <Ionicons
            name="musical-notes-outline"
            size={42}
            color={colors.subtitle}
          />
          <Text style={[styles.empty, { color: colors.subtitle }]}>
            No matching songs
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
