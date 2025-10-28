import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Image as ExpoImage } from "expo-image";
import { router, usePathname } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
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

// ✅ fallback for non-tab screens
function useSafeTabBarHeight() {
  try {
    return useBottomTabBarHeight();
  } catch {
    return Platform.OS === "ios" ? 88 : 68;
  }
}

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
  const tabBarHeight = useSafeTabBarHeight();
  const pathname = usePathname();

  const isAudioPlayerScreen = pathname?.includes("/audio/player");

  const y = useRef(new Animated.Value(80)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const hasShown = useRef(false);

  const [imageLoaded, setImageLoaded] = useState(false); // 👈 Track cover load state
  const [showDefault, setShowDefault] = useState(true); // 👈 Show static default first

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

  const defaultCover = require("@/assets/images/aud_banner.jpg");

  const cover = useMemo(() => {
    if (!current?.thumb) return defaultCover;
    return typeof current.thumb === "string"
      ? { uri: current.thumb }
      : current.thumb;
  }, [current?.thumb]);

  useEffect(() => {
    // When track changes, show default again until cover loads
    setImageLoaded(false);
    setShowDefault(true);
  }, [current?.id]);

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

  const bottomOffset = tabBarHeight - 12 + insets.bottom;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          bottom: bottomOffset,
          transform: [{ translateY: y }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, { backgroundColor: colors.card }]}>
        <View
          style={[styles.progressTrack, { backgroundColor: colors.subtitle }]}
        />
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width },
          ]}
        />

        {/* ✅ Show static image first, then fade in real cover */}
        <View style={styles.thumbWrap}>
          {showDefault && (
            <ExpoImage
              source={defaultCover}
              style={[styles.thumb, StyleSheet.absoluteFillObject]}
              contentFit="cover"
            />
          )}
          <ExpoImage
            source={cover}
            style={styles.thumb}
            contentFit="cover"
            transition={300}
            cachePolicy="disk"
            onLoadEnd={() => {
              setImageLoaded(true);
              setTimeout(() => setShowDefault(false), 150);
            }}
          />
        </View>

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

          <TouchableOpacity onPress={handlePlayPause} style={styles.iconHit}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={stop} style={styles.iconHit}>
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
    alignItems: "center",
    zIndex: 99,
  },
  bar: {
    width: "98%",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
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
  thumbWrap: {
    width: 45,
    height: 45,
    borderRadius: 6,
    marginRight: 10,
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  middle: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600" },
  subtitle: { fontSize: 12, marginTop: 2 },
  right: { flexDirection: "row", alignItems: "center", marginLeft: 10 },
  time: { fontSize: 13, marginRight: 8 },
  iconHit: { paddingHorizontal: 6, paddingVertical: 4, marginLeft: 2 },
});
