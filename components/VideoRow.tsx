// components/VideoRow.tsx
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Image,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  item: any; // raw YouTube item
  title: string;
  date?: string;
  thumb?: string;
  onDownload?: () => void;
  onShare?: () => void;
};

const YT_ID_RE = /[A-Za-z0-9_-]{11}/;

function getVideoId(v: any): string | undefined {
  if (!v) return;
  if (
    v?.snippet?.resourceId?.videoId &&
    YT_ID_RE.test(v.snippet.resourceId.videoId)
  )
    return v.snippet.resourceId.videoId;
  if (v?.contentDetails?.videoId && YT_ID_RE.test(v.contentDetails.videoId))
    return v.contentDetails.videoId;
  if (v?.id?.videoId && YT_ID_RE.test(v.id.videoId)) return v.id.videoId;

  const candidates: string[] = [];
  if (typeof v?.id === "string") candidates.push(v.id);
  if (typeof v?.snippet?.videoUrl === "string")
    candidates.push(v.snippet.videoUrl);
  if (typeof v?.snippet?.url === "string") candidates.push(v.snippet.url);

  for (const s of candidates) {
    const token = s.match(YT_ID_RE)?.[0];
    if (token) return token;
  }

  const t =
    v?.snippet?.thumbnails?.maxres?.url ||
    v?.snippet?.thumbnails?.high?.url ||
    v?.snippet?.thumbnails?.medium?.url ||
    v?.snippet?.thumbnails?.default?.url;

  if (typeof t === "string") {
    const m = t.match(/\/vi(?:_webp)?\/([A-Za-z0-9_-]{11})\//);
    if (m?.[1]) return m[1];
  }

  return undefined;
}

export default function VideoRow({
  item,
  title,
  date,
  thumb,
  onDownload,
  onShare,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { colors } = useTheme();

  const handleOpen = () => {
    router.push({
      pathname: "/video",
      params: { item: encodeURIComponent(JSON.stringify(item)) },
    });
  };

  const handleShare = () => {
    const id = getVideoId(item);
    const link =
      item?.link || item?.url || (id ? `https://youtu.be/${id}` : "");
    const text = link ? `${title}\n\n${link}` : title;

    if (Platform.OS === "ios") {
      Share.share({
        title,
        message: text,
        url: link,
      }).catch(() => {});
    } else {
      Share.share({ message: text }).catch(() => {});
    }
  };

  const handleMenu = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Download", "Share"],
          cancelButtonIndex: 0,
          userInterfaceStyle:
            colors.background === "#111827" ? "dark" : "light",
        },
        (idx) => {
          if (idx === 1) onDownload?.();
          if (idx === 2) (onShare ?? handleShare)();
        }
      );
    } else {
      setMenuOpen((v) => !v);
    }
  };

  return (
    <View style={styles.rowWrap}>
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.85}
        onPress={handleOpen}
      >
        <Image
          source={thumb ? { uri: thumb } : undefined}
          style={[styles.thumb, { backgroundColor: colors.card }]}
          resizeMode="cover"
        />
        <View style={styles.right}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={4}
          >
            {title}
          </Text>
          {!!date && (
            <Text style={[styles.date, { color: colors.subtitle }]}>
              {date}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleMenu}
          activeOpacity={0.7}
          style={styles.menuHit}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={16}
            color={colors.subtitle}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {menuOpen && Platform.OS !== "ios" && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuOpen(false)}
          />
          <View
            style={[
              styles.menu,
              {
                backgroundColor: colors.card,
                borderColor: colors.subtitle,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onDownload?.();
              }}
            >
              <Ionicons name="download-outline" size={16} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>
                Download
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                (onShare ?? handleShare)();
              }}
            >
              <Ionicons name="share-outline" size={16} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: { position: "relative" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  thumb: { width: 170, height: 96, borderRadius: 8 },
  right: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  date: { fontSize: 11 },
  menuHit: { padding: 4, alignSelf: "flex-start" },
  menu: {
    position: "absolute",
    top: 32,
    right: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    minWidth: 140,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuText: { fontSize: 14 },
});
