import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { useDownloads } from "@/store/download";
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import {
  Image as ExpoImage,
  ImageBackground as ExpoImageBackground,
} from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STATIC_COVER = require("@/assets/images/aud_banner.jpg");

type PlayMode = "shuffle" | "all" | "repeat";

const fmt = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Simple inline progress bar for downloads
const DownloadProgressBar = ({ value }: { value: number }) => (
  <View
    style={{
      height: 6,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 3,
      overflow: "hidden",
      width: "100%",
    }}
  >
    <View
      style={{
        width: `${Math.min(Math.max(value, 0), 1) * 100}%`,
        height: "100%",
        backgroundColor: "#fff",
      }}
    />
  </View>
);

export default function AudioPlayerScreen() {
  const { colors } = useTheme();
  const {
    current,
    isPlaying,
    position,
    duration,
    pause,
    resume,
    seekTo,
    queue,
    queueIndex,
    skipToNext,
    skipToPrevious,
  } = useAudioPlayer();

  const {
    downloads,
    enqueueDownload,
    isDownloaded,
    getProgress,
    removeDownload,
  } = useDownloads();

  const [playMode, setPlayMode] = useState<PlayMode>("all");
  const [showLyrics, setShowLyrics] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const scale = useRef(new Animated.Value(1)).current;
  const hasLyrics = !!current?.lyrics && current?.lyrics.trim().length > 0;

  // 🌀 Handle play mode cycling
  const cyclePlayMode = () =>
    setPlayMode((m) =>
      m === "all" ? "shuffle" : m === "shuffle" ? "repeat" : "all"
    );

  // 🔁 Auto-repeat
  useEffect(() => {
    if (playMode !== "repeat" || !duration) return;
    const nearEnd = position >= duration - 250;
    if (nearEnd && !isPlaying) {
      seekTo(0)
        .then(resume)
        .catch(() => {});
    }
  }, [position, duration, isPlaying, playMode]);

  // 🎬 Animate cover
  useEffect(() => {
    Animated.spring(scale, {
      toValue: isPlaying ? 1 : 0.96,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  // 🖼️ Extract metadata
  const { cover, title, author } = useMemo(
    () => ({
      cover: STATIC_COVER,
      title: current?.title || "Now Playing",
      author: current?.author || "Unknown Artist",
    }),
    [current]
  );

  // 🎚️ Local slider sync
  const dragging = useRef(false);
  const [localPos, setLocalPos] = useState(0);
  useEffect(() => {
    if (!dragging.current) setLocalPos(position);
  }, [position]);

  // 📤 Share
  const onShare = () => {
    const link = current?.downloadUrl || current?.streamUrl || "";
    const text = link ? `${title}\n\n${link}` : title;
    Share.share(
      Platform.OS === "ios"
        ? { title, message: text, url: link }
        : { message: text }
    ).catch(() => {});
  };

  // 📥 Download logic
  const isCompleted = isDownloaded(current?.id ?? "");
  const currentProgress = getProgress(current?.id ?? "") || 0;

  useEffect(() => {
    if (downloading && currentProgress !== progress) {
      setProgress(currentProgress);
    }
  }, [currentProgress]);

  const handleDownload = async () => {
    try {
      if (!current) return;

      if (!current.downloadUrl && !current.streamUrl) {
        Alert.alert("Unavailable", "This audio cannot be downloaded.");
        return;
      }

      if (isCompleted) {
        Alert.alert(
          "Already Downloaded",
          `"${current.title}" is already available offline.`,
          [
            {
              text: "Delete",
              style: "destructive",
              onPress: () => removeDownload(current.id),
            },
            { text: "OK" },
          ]
        );
        return;
      }

      const url = current.downloadUrl || current.streamUrl || "";
      setDownloading(true);

      enqueueDownload(
        {
          id: current.id,
          title: current.title,
          author: current.author,
          thumb: current.thumb,
          type: "audio",
        },
        url
      );
    } catch (err) {
      console.error("❌ Download failed:", err);
      setDownloading(false);
      Alert.alert("Error", "Failed to download audio.");
    }
  };

  const prevDisabled = queueIndex <= 0;
  const nextDisabled = queueIndex >= queue.length - 1;

  return (
    <ScreenWrapper
      style={{ backgroundColor: "#B61040" }}
      statusBarColor="transparent"
      barStyle="light-content"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]} />
      {/* 🔹 Background */}
      <ExpoImageBackground
        source={STATIC_COVER}
        blurRadius={7}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      {/* 🔹 TopBar */}
      <TopBar
        title={showLyrics ? "Lyrics" : "Now Playing"}
        titleColor={colors.white}
        leftIcons={[
          {
            name: "arrow-back",
            onPress: () => router.back(),
            color: colors.white,
          },
        ]}
        rightIcons={[
          {
            name: hasLyrics
              ? showLyrics
                ? "musical-notes-outline"
                : "document-text-outline"
              : "musical-notes-outline",
            onPress: () => hasLyrics && setShowLyrics(!showLyrics),
            color: hasLyrics ? colors.white : "rgba(255,255,255,0.5)",
          },
        ]}
      />

      {/* 🔹 Main Content */}
      {showLyrics && hasLyrics ? (
        <ScrollView
          style={styles.lyricsScroll}
          contentContainerStyle={{
            paddingBottom: 120,
            paddingHorizontal: 20,
          }}
        >
          <Text style={[styles.lyricsText, { color: colors.white }]}>
            {current?.lyrics}
          </Text>
        </ScrollView>
      ) : (
        <>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.white }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: "rgba(255,255,255,0.9)" }]}>
              {author}
            </Text>
          </View>

          <View style={styles.artWrap}>
            <Animated.View style={{ transform: [{ scale }] }}>
              <ExpoImage
                source={STATIC_COVER}
                style={styles.art}
                contentFit="cover"
              />
            </Animated.View>
          </View>
        </>
      )}

      {/* 🔹 Bottom Controls */}
      <View style={styles.bottomPanelShadowWrap}>
        <View
          style={[styles.bottomPanel, { backgroundColor: "rgba(0,0,0,0.25)" }]}
        >
          {/* Transport Controls */}
          <View style={styles.transportRow}>
            <TouchableOpacity
              style={styles.smlBtn}
              onPress={() =>
                seekTo(
                  Math.max(0, (dragging.current ? localPos : position) - 15000)
                )
              }
            >
              <Ionicons name="play-back" size={22} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smlBtn}
              disabled={prevDisabled}
              onPress={skipToPrevious}
            >
              <Ionicons
                name="play-skip-back"
                size={22}
                color={prevDisabled ? "rgba(255,255,255,0.5)" : colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.white }]}
              onPress={() => (isPlaying ? pause() : resume())}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={32}
                color="#111"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smlBtn}
              disabled={nextDisabled}
              onPress={skipToNext}
            >
              <Ionicons
                name="play-skip-forward"
                size={22}
                color={nextDisabled ? "rgba(255,255,255,0.5)" : colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smlBtn}
              onPress={() =>
                seekTo(
                  Math.min(
                    duration,
                    (dragging.current ? localPos : position) + 15000
                  )
                )
              }
            >
              <Ionicons name="play-forward" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={{ marginTop: 14 }}>
            <Slider
              style={{ width: "100%", height: 38 }}
              minimumValue={0}
              maximumValue={duration || 1}
              value={localPos}
              minimumTrackTintColor={colors.white}
              maximumTrackTintColor="rgba(255,255,255,0.25)"
              thumbTintColor={colors.white}
              onSlidingStart={() => (dragging.current = true)}
              onValueChange={setLocalPos}
              onSlidingComplete={(v) => {
                dragging.current = false;
                seekTo(v);
              }}
            />
            <View style={styles.timeRow}>
              <Text style={{ color: colors.white }}>{fmt(localPos)}</Text>
              <Text style={{ color: colors.white }}>{fmt(duration)}</Text>
            </View>
          </View>

          {/* Download Progress */}
          {(downloading || currentProgress > 0) && (
            <View style={{ marginTop: 10 }}>
              <DownloadProgressBar value={currentProgress} />
              <Text style={styles.progressText}>
                {Math.floor(currentProgress * 100)}%
              </Text>
            </View>
          )}

          {/* Info + Bottom Icons */}
          <Text style={[styles.indexText, { color: colors.white }]}>
            {queueIndex + 1} / {queue.length || 1}
          </Text>
          <Text style={[styles.sourceText, { color: "rgba(255,255,255,0.9)" }]}>
            {current?.sourceLabel ?? "From Playlist"}
          </Text>

          <View style={styles.bottomIcons}>
            <TouchableOpacity onPress={cyclePlayMode} style={{ padding: 8 }}>
              <Ionicons
                name={
                  (playMode === "shuffle"
                    ? "shuffle"
                    : playMode === "repeat"
                    ? "repeat"
                    : "play-outline") as any
                }
                size={28}
                color={
                  playMode === "all" ? "rgba(255,255,255,0.5)" : colors.primary
                }
              />
            </TouchableOpacity>

            {/* <TouchableOpacity onPress={handleDownload} disabled={downloading}>
              {downloading ? (
                <ActivityIndicator color={colors.white} />
              ) : isCompleted ? (
                <Ionicons
                  name="checkmark-done"
                  size={28}
                  color={colors.white}
                />
              ) : (
                <Ionicons
                  name="download-outline"
                  size={28}
                  color={colors.white}
                />
              )}
            </TouchableOpacity> */}

            <TouchableOpacity
              onPress={() => router.push("/queue")}
              style={{ padding: 8 }}
            >
              <Ionicons name="list-outline" size={28} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  titleBlock: { alignItems: "center", paddingHorizontal: 18, marginTop: 6 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  subtitle: { textAlign: "center", marginTop: 4, fontSize: 13 },
  artWrap: { alignItems: "center", marginTop: 20 },
  art: { width: 270, height: 270, borderRadius: 16 },
  bottomPanelShadowWrap: {
    flex: 1,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -6 },
  },
  bottomPanel: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  transportRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 8,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  smlBtn: { padding: 10 },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressText: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  indexText: { textAlign: "center", marginTop: 8 },
  sourceText: { textAlign: "center", marginTop: 6 },
  bottomIcons: {
    marginTop: 16,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  lyricsScroll: { flex: 1, marginTop: 10 },
  lyricsText: { fontSize: 16, textAlign: "center", fontWeight: "400" },
});
