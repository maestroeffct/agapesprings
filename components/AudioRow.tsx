// components/AudioRow.tsx
import { colors as staticColors } from "@/constants/theme";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import { useDownloads } from "@/store/download";
import { useTheme } from "@/store/ThemeContext";
import type { AudioItem } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActionSheetIOS,
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
};

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function AudioRow({
  item,
  index,
  fullList,
  onDownload,
  onShare,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { current, play } = useAudioPlayer();
  const { colors, themeName } = useTheme();
  const { isDownloaded, getProgress } = useDownloads();

  const progress = getProgress(item.id);
  const downloaded = isDownloaded(item.id);
  const downloading = progress > 0 && progress < 1;

  const startDownload = () => {
    if (onDownload) onDownload(item);
  };
  const onRowPress = async () => {
    const isSame = current && String(current.id) === String(item.id);
    if (isSame) {
      router.push("/audio-player");
      return;
    }

    // ✅ play the full queue, starting from this index
    await play(item, fullList);

    router.push("/audio-player");
  };

  const handleShare = () => {
    const link = item.downloadUrl || item.streamUrl || "";
    const text = link ? `${item.title}\n\n${link}` : item.title;
    if (Platform.OS === "ios") {
      Share.share({ title: item.title, message: text, url: link }).catch(
        () => {}
      );
    } else {
      Share.share({ message: text }).catch(() => {});
    }
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
          if (idx === 1) onDownload ? onDownload(item) : null;
          if (idx === 2) onShare ? onShare(item) : handleShare();
        }
      );
    } else {
      setMenuOpen((v) => !v);
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
          source={item.thumb}
          style={[styles.thumb, { backgroundColor: colors.card }]}
          contentFit="cover"
          transition={150}
          cachePolicy="disk"
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

        <View style={styles.rightBtns}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={startDownload}
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

          <TouchableOpacity
            style={[styles.iconBtn, { marginLeft: 6 }]}
            onPress={openMenu}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={colors.subtitle}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Android dropdown */}
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
                shadowColor: colors.text,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onDownload ? onDownload(item) : null;
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
  thumb: {
    width: 65,
    height: 65,
    borderRadius: 8,
    marginRight: 8,
  },
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
  iconBtn: {
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  progressText: {
    position: "absolute", // ✅ overlay text inside same box
    fontSize: 10,
    fontWeight: "600",
    color: "#007bff", // or colors.primary
    padding: 20,
  },
  // iconBtn: { padding: 4, borderRadius: 8 },

  // android popup
  menu: {
    position: "absolute",
    zIndex: 9999,
    top: 34,
    right: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    minWidth: 140,
    elevation: 6,
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
