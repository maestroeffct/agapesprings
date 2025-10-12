import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { router, usePathname } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const fmt = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function MiniAudioPlayer() {
  const {
    current,
    isPlaying,
    position,
    duration,
    pause,
    resume,
    stop,
    seekTo,
  } = useAudioPlayer();

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isAudioPlayerScreen = pathname?.includes("/audio-player");

  const y = useRef(new Animated.Value(80)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const hasShown = useRef(false);

  useEffect(() => {
    if (current && !hasShown.current) {
      hasShown.current = true;
      Animated.timing(y, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else if (!current && hasShown.current) {
      hasShown.current = false;
      Animated.timing(y, {
        toValue: 80,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [!!current]);

  const pct = duration ? (position / duration) * 100 : 0;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const cover = useMemo(() => {
    if (!current?.thumb) return require("@/assets/images/aud1.png");
    return typeof current.thumb === "string"
      ? { uri: current.thumb }
      : current.thumb;
  }, [current?.thumb]);

  const ended = duration > 0 && position >= duration - 750;

  const handlePlayPause = async () => {
    if (isPlaying) await pause();
    else if (ended) {
      await seekTo(0);
      await resume();
    } else await resume();
  };

  if (!current || isAudioPlayerScreen) return null;

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          transform: [{ translateY: y }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, { backgroundColor: colors.card }]}>
        {/* progress */}
        <View
          style={[styles.progressTrack, { backgroundColor: colors.subtitle }]}
        />
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width },
          ]}
        />

        <ExpoImage
          source={cover}
          style={styles.thumb}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />

        <TouchableOpacity
          style={styles.middle}
          activeOpacity={0.9}
          onPress={() => router.push("/audio-player")}
        >
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {current.title}
          </Text>
          <Text
            style={[styles.subtitle, { color: colors.subtitle }]}
            numberOfLines={1}
          >
            {current.author ?? "Unknown Author"}
          </Text>
        </TouchableOpacity>

        <View style={styles.right}>
          <Text style={[styles.time, { color: colors.text }]}>
            {fmt(position)}
          </Text>

          <TouchableOpacity
            accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
            onPress={handlePlayPause}
            style={styles.iconHit}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Stop audio"
            onPress={stop}
            style={styles.iconHit}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: "center",
  },
  bar: {
    width: "100%",
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  progressTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  progressFill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  thumb: { width: 45, height: 45, borderRadius: 6, marginRight: 10 },
  middle: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600" },
  subtitle: { fontSize: 12, marginTop: 2 },
  right: { flexDirection: "row", alignItems: "center", marginLeft: 10 },
  time: { fontSize: 13, marginRight: 8 },
  iconHit: { paddingHorizontal: 6, paddingVertical: 4, marginLeft: 2 },
});
