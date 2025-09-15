import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import TrackPlayer from "react-native-track-player";

export default function QueueScreen() {
  const { colors } = useTheme();
  const { queue, queueIndex, play, setQueue, current } = useAudioPlayer();

  const cover = useMemo(
    () => current?.thumb || require("@/assets/images/aud1.png"),
    [current?.thumb]
  );

  const removeTrack = async (id: string | number) => {
    const index = queue.findIndex((q) => q.id === id);
    if (index === -1) return;

    const updated = queue.filter((q) => q.id !== id);
    setQueue(updated);

    try {
      await TrackPlayer.remove([index]); // remove by index
    } catch (e) {
      console.warn("Track remove failed:", e);
    }
  };

  const reorderQueue = async (newQueue: typeof queue) => {
    setQueue(newQueue);

    try {
      await TrackPlayer.reset();
      await TrackPlayer.add(
        newQueue.map((t) => ({
          id: t.id.toString(),
          url: t.streamUrl || t.downloadUrl || "",
          title: t.title,
          artist: t.author || "Unknown Artist",
          artwork: t.thumb,
        }))
      );
    } catch (e) {
      console.warn("Reorder failed:", e);
    }
  };

  const goBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/audio-player"); // fallback to player
    }
  };

  return (
    <ScreenWrapper
      style={{ backgroundColor: "transparent" }} // ✅ transparent wrapper
      statusBarColor="transparent" // ✅ transparent status bar to match
      barStyle="light-content" // ✅ ensure icons are visible on dark bg
    >
      {/* ✅ Same blurred artwork background */}
      <ImageBackground
        source={cover}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={2}
        imageStyle={{ transform: [{ scale: 1.45 }] }}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.25)" },
          ]}
        />
      </ImageBackground>

      {/* TopBar */}
      <TopBar
        title="Now Playing"
        titleColor={colors.white}
        leftIcons={[
          {
            name: "arrow-back",
            onPress: goBackSafe,
            color: colors.white,
          },
        ]}
      />

      {/* Draggable queue list */}
      <DraggableFlatList
        data={queue}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        onDragEnd={({ data }) => {
          // ✅ 1. Update UI immediately
          if (JSON.stringify(data) !== JSON.stringify(queue)) {
            setQueue(data);
          }

          // ✅ 2. Only touch TrackPlayer if the current item moved
          if (current) {
            const newIndex = data.findIndex((t) => t.id === current.id);
            if (newIndex !== -1 && newIndex !== queueIndex) {
              // Small delay prevents race conditions & UI blink
              setTimeout(() => {
                TrackPlayer.skip(newIndex).catch(() => {});
              }, 50);
            }
          }
        }}
        renderItem={({
          item,
          getIndex,
          drag,
        }: RenderItemParams<(typeof queue)[0]>) => {
          const index = getIndex?.() ?? -1;

          return (
            <TouchableOpacity
              style={[
                styles.queueItem,
                {
                  backgroundColor:
                    index === queueIndex
                      ? "rgba(255,255,255,0.15)"
                      : "transparent",
                },
              ]}
              onLongPress={drag}
              delayLongPress={120}
              onPress={() => play(item, queue)}
            >
              <Ionicons
                name="reorder-two-outline"
                size={18}
                color={colors.white}
                style={{ marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.queueText, { color: colors.white }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[styles.queueSub, { color: colors.white }]}
                  numberOfLines={1}
                >
                  {item.author ?? "Unknown"}
                </Text>
              </View>
              <TouchableOpacity
                onPressIn={(e) => e.stopPropagation()}
                onPress={() => removeTrack(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  queueText: { fontSize: 14, fontWeight: "600" },
  queueSub: { fontSize: 12, marginTop: 2 },
});
