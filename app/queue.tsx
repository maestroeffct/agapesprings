import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import {
  Image as ExpoImage,
  ImageBackground as ExpoImageBackground,
} from "expo-image";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import TrackPlayer from "react-native-track-player";

export default function QueueScreen() {
  const { colors } = useTheme();
  const { queue, queueIndex, play, setQueue, current } = useAudioPlayer();
  const STATIC_COVER = require("@/assets/images/aud_banner.jpg");

  useEffect(() => {
    if (queue?.length) {
      queue.forEach((item) => {
        if (item.thumb) ExpoImage.prefetch(item.thumb);
      });
    }
  }, [queue]);

  const removeTrack = async (id: string | number) => {
    const index = queue.findIndex((q) => q.id === id);
    if (index === -1) return;
    const updated = queue.filter((q) => q.id !== id);
    setQueue(updated);
    try {
      await TrackPlayer.remove([index]);
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
    if (router.canGoBack()) router.back();
    else router.replace("/audio-player");
  };

  return (
    <ScreenWrapper
      style={{ backgroundColor: "transparent" }}
      statusBarColor="transparent"
      barStyle="light-content"
    >
      {/* ✅ Cached blurred artwork background */}
      <ExpoImageBackground
        source={STATIC_COVER}
        blurRadius={4}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="disk"
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.3)" },
          ]}
        />
      </ExpoImageBackground>

      {/* TopBar */}
      <TopBar
        title="Play Queue"
        titleColor={colors.white}
        leftIcons={[
          { name: "arrow-back", onPress: goBackSafe, color: colors.white },
        ]}
      />

      {/* Queue list */}
      <DraggableFlatList
        data={queue}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        onDragEnd={({ data }) => {
          if (JSON.stringify(data) !== JSON.stringify(queue)) {
            setQueue(data);
            reorderQueue(data);
          }
          if (current) {
            const newIndex = data.findIndex((t) => t.id === current.id);
            if (newIndex !== -1 && newIndex !== queueIndex) {
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
          const isActive = index === queueIndex;

          return (
            <TouchableOpacity
              style={[
                styles.queueItem,
                {
                  backgroundColor: isActive
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(255,255,255,0.05)",
                },
              ]}
              onLongPress={drag}
              delayLongPress={100}
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
                accessibilityLabel="Remove from queue"
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
