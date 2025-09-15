import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { useDownloads } from "@/store/download";
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Downloads() {
  const { colors } = useTheme();
  const router = useRouter();
  const { downloads, removeDownload } = useDownloads();

  const { play, setQueue, current } = useAudioPlayer(); // 👈 also grab `current`

  const handlePlay = async (item: any) => {
    if (item.status !== "completed" || !item.localPath) return;

    // if this is already playing, just navigate once
    if (current && String(current.id) === String(item.id)) {
      router.replace("/audio-player"); // 👈 replace avoids stacking
      return;
    }

    const downloadedList = Object.values(downloads)
      .filter((d) => d.status === "completed" && d.localPath)
      .map((d) => ({
        id: d.id,
        title: d.title,
        author: d.author,
        thumb: d.thumb,
        streamUrl: d.localPath,
        downloadUrl: d.localPath,
      }));

    setQueue(downloadedList);

    await play(
      {
        id: item.id,
        title: item.title,
        author: item.author,
        thumb: item.thumb,
        streamUrl: item.localPath,
        downloadUrl: item.localPath,
      },
      downloadedList
    );

    router.replace("/audio-player"); // 👈 only one screen, no duplicates
  };

  const handleDelete = (id: string | number) => {
    Alert.alert(
      "Delete Download",
      "Are you sure you want to remove this file?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeDownload(id);
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      statusBarColor={colors.background}
      barStyle={
        colors.background === "#111827" ? "light-content" : "dark-content"
      }
    >
      <TopBar
        title="Downloads"
        leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
      />

      <FlatList
        data={Object.values(downloads)}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const downloading = item.status === "downloading";
          const completed = item.status === "completed";

          return (
            <View style={[styles.item, { borderBottomColor: colors.subtitle }]}>
              {/* Tap area for play */}
              <TouchableOpacity
                style={styles.infoWrap}
                onPress={() => handlePlay(item)}
                disabled={!completed}
              >
                <ExpoImage
                  source={item.thumb}
                  style={[styles.thumb, { backgroundColor: colors.card }]}
                  contentFit="cover"
                  cachePolicy="disk"
                />

                <View style={styles.info}>
                  <Text
                    style={[styles.title, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  {!!item.author && (
                    <Text
                      style={[styles.author, { color: colors.subtitle }]}
                      numberOfLines={1}
                    >
                      {item.author}
                    </Text>
                  )}

                  <View style={styles.metaRow}>
                    {downloading ? (
                      <View style={styles.progressWrap}>
                        <Loading size="small" color={colors.primary} />
                        <Text
                          style={[
                            styles.progressText,
                            { color: colors.primary },
                          ]}
                        >
                          {Math.round((item.progress ?? 0) * 100)}%
                        </Text>
                      </View>
                    ) : completed ? (
                      <Ionicons
                        name="checkmark-done-outline"
                        size={18}
                        color={colors.primary}
                      />
                    ) : (
                      <Text style={{ color: colors.subtitle }}>Queued</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Delete button */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.subtitle }}>No downloads yet.</Text>
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
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-between",
  },
  infoWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600" },
  author: { fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  progressWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressText: { fontSize: 12, fontWeight: "600" },
  deleteBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
});
