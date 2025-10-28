import { useTheme } from "@/store/ThemeContext";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import React, { memo, useCallback, useEffect } from "react";
import {
  ActionSheetIOS,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  item: any;
  title: string;
  date?: string;
  thumb?: string;
  onDownload?: () => void;
  onShare?: () => void;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  closeMenu?: () => void;
  onPress?: () => void;
};

const YT_ID_RE = /[A-Za-z0-9_-]{11}/;
function getVideoId(v: any): string | undefined {
  if (!v) return;
  const possible =
    v?.snippet?.resourceId?.videoId ||
    v?.contentDetails?.videoId ||
    v?.id?.videoId;
  return possible && YT_ID_RE.test(possible) ? possible : undefined;
}

function VideoRowComponent({
  item,
  title,
  date,
  thumb,
  onDownload,
  onShare,
  menuOpen = false,
  onToggleMenu,
  closeMenu,
  onPress,
}: Props) {
  const { colors } = useTheme();

  // Prefetch for smoother scroll reuse
  useEffect(() => {
    if (thumb) ExpoImage.prefetch(thumb);
  }, [thumb]);

  const handleOpen = () => {
    if (onPress) return onPress(); // ✅ prioritize parent-defined handler
    router.push({
      pathname: "/video",
      params: { item: encodeURIComponent(JSON.stringify(item)) },
    });
  };

  const handleShare = useCallback(() => {
    const id = getVideoId(item);
    const link =
      item?.link || item?.url || (id ? `https://youtu.be/${id}` : "");
    const text = link ? `${title}\n\n${link}` : title;
    Share.share(
      Platform.OS === "ios"
        ? { title, message: text, url: link }
        : { message: text }
    ).catch(() => {});
  }, [item, title]);

  const handleMenu = useCallback(() => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Download", "Share"],
          cancelButtonIndex: 0,
          userInterfaceStyle: colors.background === "dark" ? "dark" : "light",
        },
        (idx) => {
          if (idx === 1) onDownload?.();
          if (idx === 2) (onShare ?? handleShare)();
        }
      );
    } else {
      onToggleMenu?.();
    }
  }, [onDownload, onShare, handleShare, colors]);

  return (
    <View style={styles.rowWrap}>
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.85}
        onPress={handleOpen}
        accessible
        accessibilityLabel={`Video titled ${title}, published ${date}`}
        accessibilityRole="button"
      >
        <ExpoImage
          recyclingKey={item.id?.videoId}
          source={
            thumb ? { uri: thumb } : require("@/assets/images/vid_cover.png")
          }
          placeholder={require("@/assets/images/vid_cover.png")}
          style={[styles.thumb, { backgroundColor: colors.card }]}
          contentFit="cover"
          placeholderContentFit="cover"
          transition={200}
          cachePolicy="disk"
        />

        <View style={styles.right}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={5}
          >
            {title}
          </Text>
          {!!date && (
            <Text
              style={[styles.date, { color: colors.subtitle, opacity: 0.8 }]}
            >
              {date}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default memo(VideoRowComponent);

const styles = StyleSheet.create({
  rowWrap: { marginBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  thumb: { width: 200, height: 130, borderRadius: 8 },
  right: { flex: 1, justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  date: { fontSize: 11 },
  menuHit: { padding: 4, alignSelf: "flex-start" },
  menu: {
    marginTop: 4,
    alignSelf: "flex-end",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    minWidth: 140,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
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
