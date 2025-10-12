import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
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
  Animated,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PlayMode = "shuffle" | "all" | "repeat";

const fmt = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

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

  const [playMode, setPlayMode] = useState<PlayMode>("all");
  const scale = useRef(new Animated.Value(1)).current;

  const cyclePlayMode = () =>
    setPlayMode((m) =>
      m === "all" ? "shuffle" : m === "shuffle" ? "repeat" : "all"
    );

  // Auto-restart if repeat mode
  useEffect(() => {
    if (playMode !== "repeat" || !duration) return;
    const nearEnd = position >= duration - 250;
    if (nearEnd && !isPlaying) {
      seekTo(0)
        .then(resume)
        .catch(() => {});
    }
  }, [position, duration, isPlaying, playMode, seekTo, resume]);

  // Animate scale on play/pause
  useEffect(() => {
    Animated.spring(scale, {
      toValue: isPlaying ? 1 : 0.96,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  // Memoize cover, title, and author
  const { cover, title, author } = useMemo(
    () => ({
      cover:
        current?.thumb && typeof current.thumb === "string"
          ? { uri: current.thumb }
          : current?.thumb || require("@/assets/images/aud1.png"),
      title: current?.title || "Now Playing",
      author: current?.author || "Unknown Author",
    }),
    [current]
  );

  // Prefetch next artwork for instant transitions
  useEffect(() => {
    const next = queue[queueIndex + 1];
    if (next?.thumb) ExpoImage.prefetch(next.thumb);
  }, [queueIndex, queue]);

  // Slider local state
  const dragging = useRef(false);
  const [localPos, setLocalPos] = useState(0);
  useEffect(() => {
    if (!dragging.current) setLocalPos(position);
  }, [position]);

  // Sharing handler
  const onShare = () => {
    const link = current?.downloadUrl || current?.streamUrl || "";
    const text = link ? `${title}\n\n${link}` : title;
    Share.share(
      Platform.OS === "ios"
        ? { title, message: text, url: link }
        : { message: text }
    ).catch(() => {});
  };

  const prevDisabled = queueIndex <= 0;
  const nextDisabled = queueIndex >= queue.length - 1;

  return (
    <ScreenWrapper
      style={{ backgroundColor: "transparent" }}
      statusBarColor="transparent"
      barStyle="light-content"
    >
      {/* Background */}
      <ExpoImageBackground
        source={cover}
        blurRadius={7}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="disk"
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.25)" },
          ]}
        />
      </ExpoImageBackground>

      {/* TopBar */}
      <TopBar
        title="Now Playing"
        titleColor={colors.white}
        leftIcons={[
          {
            name: "arrow-back",
            onPress: () => router.back(),
            color: colors.white,
          },
        ]}
        rightIcons={[
          { name: "heart-outline", onPress: () => {}, color: colors.white },
          { name: "share-outline", onPress: onShare, color: colors.white },
        ]}
      />

      {/* Title / Author */}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.white }]} numberOfLines={2}>
          {title}
        </Text>
        <Text
          style={[styles.subtitle, { color: "rgba(255,255,255,0.9)" }]}
          numberOfLines={1}
        >
          {author}
        </Text>
      </View>

      {/* Artwork */}
      <View style={styles.artWrap}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <ExpoImage
            source={cover}
            style={styles.art}
            contentFit="cover"
            transition={100}
            cachePolicy="disk"
            placeholder={require("@/assets/images/aud1.png")}
          />
        </Animated.View>
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanelShadowWrap}>
        <View
          style={[styles.bottomPanel, { backgroundColor: "rgba(0,0,0,0.25)" }]}
        >
          {/* Controls */}
          <View style={styles.transportRow}>
            <TouchableOpacity
              style={styles.smlBtn}
              onPress={() =>
                seekTo(
                  Math.max(0, (dragging.current ? localPos : position) - 15000)
                )
              }
              accessibilityLabel="Rewind 15 seconds"
            >
              <Ionicons name="play-back" size={22} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smlBtn}
              disabled={prevDisabled}
              onPress={skipToPrevious}
              accessibilityLabel="Previous track"
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
              accessibilityLabel={isPlaying ? "Pause" : "Play"}
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
              accessibilityLabel="Next track"
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
              accessibilityLabel="Forward 15 seconds"
            >
              <Ionicons name="play-forward" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Slider */}
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
              <Text style={[{ color: colors.white }]}>{fmt(localPos)}</Text>
              <Text style={[{ color: colors.white }]}>{fmt(duration)}</Text>
            </View>
          </View>

          {/* Queue Info */}
          <Text style={[styles.indexText, { color: colors.white }]}>
            {queueIndex + 1} / {queue.length || 1}
          </Text>
          <Text style={[styles.sourceText, { color: "rgba(255,255,255,0.9)" }]}>
            From All Sermons
          </Text>

          {/* Bottom Icons */}
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

            <Ionicons name="download-outline" size={28} color={colors.white} />
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
  title: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  subtitle: { textAlign: "center", marginTop: 4, fontSize: 12 },
  artWrap: { alignItems: "center", marginTop: 12 },
  art: { width: 260, height: 260, borderRadius: 14 },
  bottomPanelShadowWrap: {
    flex: 1,
    marginTop: 14,
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
  indexText: { textAlign: "center", marginTop: 8 },
  sourceText: { textAlign: "center", marginTop: 6 },
  bottomIcons: {
    marginTop: 16,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-around",
  },
});
