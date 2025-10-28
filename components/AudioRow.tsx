import { colors as staticColors } from "@/constants/theme";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { useDownloads } from "@/store/download";
import { useTheme } from "@/store/ThemeContext";
import type { AudioItem } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Image as ExpoImage } from "expo-image";
import { router, usePathname } from "expo-router";
import React from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Loading from "./Loading";

type Props = {
  item: AudioItem;
  index: number;
  fullList: AudioItem[];
  onDownload?: (it: AudioItem) => void;
  onShare?: (it: AudioItem) => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  closeMenu: () => void;
};

const PLACEHOLDER = require("@/assets/images/aud_message.png");

const formatDate = (iso?: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

export default function AudioRow({
  item,
  fullList,
  onDownload,
  onShare,
  menuOpen,
  onToggleMenu,
  closeMenu,
}: Props) {
  const { current, play } = useAudioPlayer();
  const { colors, themeName } = useTheme();
  const { isDownloaded, getProgress, getLocalUri } = useDownloads();
  const pathname = usePathname();

  const progress = getProgress(item.id);
  const downloaded = isDownloaded(item.id);
  const downloading = progress > 0 && progress < 1;

  const onRowPress = async () => {
    try {
      const localUri = getLocalUri(item.id);

      // ✅ Determine correct URL (local or stream)
      const uri =
        localUri && localUri.startsWith("file://")
          ? localUri
          : localUri
          ? `file://${localUri}`
          : item.streamUrl;

      if (!uri) {
        Alert.alert("Playback error", "No valid file or stream URL found.");
        return;
      }

      // ✅ Verify file existence if local
      if (uri.startsWith("file://")) {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists) {
          Alert.alert(
            "Missing file",
            "This downloaded audio file no longer exists."
          );
          return;
        }
      }

      // ✅ Build clean queue with only valid URIs
      const queue = fullList
        .map((a) => {
          const loc = getLocalUri(a.id);
          const validUri = loc
            ? loc.startsWith("file://")
              ? loc
              : `file://${loc}`
            : a.streamUrl;
          if (!validUri) return null;
          return {
            id: a.id,
            title: a.title,
            author: a.author || "Unknown Speaker",
            streamUrl: validUri,
            thumb: a.thumb || PLACEHOLDER,
            sourceLabel: loc ? "Offline" : "Online",
          };
        })
        .filter(Boolean) as AudioItem[];

      await play(
        {
          id: item.id,
          title: item.title,
          author: item.author || "Unknown Speaker",
          streamUrl: uri,
          thumb: item.thumb || PLACEHOLDER,
          sourceLabel: downloaded ? "Offline" : "Online",
        },
        queue,
        { smooth: true }
      );

      if (!pathname?.includes("/audio-player")) router.push("/audio-player");
    } catch (err) {
      console.error("❌ Audio playback error:", err);
      Alert.alert("Playback error", "Could not play this sermon.");
    }
  };

  const handleShare = () => {
    const link = item.downloadUrl || item.streamUrl || "";
    const text = link ? `${item.title}\n\n${link}` : item.title;
    Share.share(
      Platform.OS === "ios"
        ? { title: item.title, message: text, url: link }
        : { message: text }
    ).catch(() => {});
  };

  const openMenu = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Download", "Share"],
          cancelButtonIndex: 0,
          userInterfaceStyle: themeName === "dark" ? "dark" : "light",
        },
        (idx) => {
          if (idx === 1) onDownload?.(item);
          if (idx === 2) onShare ? onShare(item) : handleShare();
        }
      );
    } else {
      onToggleMenu();
    }
  };

  return (
    <View style={styles.rowWrap}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onRowPress}
        style={styles.row}
      >
        <ExpoImage
          source={item.thumb || PLACEHOLDER}
          placeholder={PLACEHOLDER}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
          recyclingKey={String(item.id)}
          style={[styles.thumb, { backgroundColor: colors.card }]}
        />

        <View style={styles.mid}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View style={styles.metaRow}>
            {!!item.tag && (
              <View
                style={[
                  styles.chip,
                  {
                    borderColor: staticColors.primary,
                    backgroundColor: staticColors.rose,
                  },
                ]}
              >
                <Text
                  style={[styles.chipText, { color: staticColors.primary }]}
                  numberOfLines={1}
                >
                  {item.tag}
                </Text>
              </View>
            )}

            <Text style={[styles.dimText, { color: colors.subtitle }]}>
              {!!item.sizeMB && `${item.sizeMB}MB`}
              {item.sizeMB && item.dateISO ? "   " : ""}
              {!!item.dateISO && formatDate(item.dateISO)}
            </Text>
          </View>
        </View>

        {/* ✅ Right Buttons */}
        <View style={styles.rightBtns}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onDownload?.(item)}
            disabled={downloading || downloaded}
          >
            {downloading ? (
              <>
                <Loading size="small" color={colors.primary} />
                <Text style={styles.progressText}>
                  {Math.round(progress * 100)}%
                </Text>
              </>
            ) : downloaded ? (
              <Ionicons
                name="checkmark-done-outline"
                size={20}
                color={colors.primary}
              />
            ) : (
              <Ionicons
                name="download-outline"
                size={20}
                color={colors.subtitle}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Android menu overlay */}
      {menuOpen && Platform.OS !== "ios" && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
          <View
            style={[
              styles.menu,
              { backgroundColor: colors.card, borderColor: colors.subtitle },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                onDownload?.(item);
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
                closeMenu();
                onShare ? onShare(item) : handleShare();
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
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 2,
  },
  thumb: { width: 65, height: 65, borderRadius: 8, marginRight: 8 },
  mid: { flex: 1, paddingRight: 8 },
  title: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: { fontSize: 11, fontWeight: "600" },
  dimText: { fontSize: 12 },
  rightBtns: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  iconBtn: { justifyContent: "center", alignItems: "center", padding: 4 },
  progressText: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "600",
    color: "#007bff",
    padding: 20,
  },
  menu: {
    position: "absolute",
    zIndex: 9999,
    top: 34,
    right: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    minWidth: 140,
    elevation: 8,
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
