import { Ionicons } from "@expo/vector-icons";
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

export type AudioRowItem = {
  id: string | number;
  title: string;
  thumb?: any; // require(...) or {uri}
  size?: string; // "21MB"
  date?: string; // "25 May, 2017"
  downloadUrl?: string;
  shareUrl?: string;
};

type Props = {
  index: number; // 1-based
  item: AudioRowItem;
  onPress?: (it: AudioRowItem) => void;
  onDownload?: (it: AudioRowItem) => void;
  onMore?: (it: AudioRowItem) => void;
};

export default function AudioRowCompact({
  index,
  item,
  onPress,
  onDownload,
  onMore,
}: Props) {
  const [open, setOpen] = useState(false);

  const share = () => {
    const link = item.shareUrl ?? item.downloadUrl ?? "";
    const text = link ? `${item.title}\n${link}` : item.title;
    if (Platform.OS === "ios") {
      Share.share({ title: item.title, message: text, url: link }).catch(
        () => {}
      );
    } else {
      Share.share({ message: text }).catch(() => {});
    }
  };

  const handleMore = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Download", "Share"],
          cancelButtonIndex: 0,
          userInterfaceStyle: "light",
        },
        (i) => {
          if (i === 1) onDownload?.(item);
          if (i === 2) share();
        }
      );
    } else {
      setOpen((v) => !v);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
        onPress={() => onPress?.(item)}
      >
        <Text style={styles.index}>{index}</Text>

        <Image
          source={item.thumb ? item.thumb : undefined}
          style={styles.thumb}
        />

        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.meta}>
            {item.size ?? ""}
            {item.size && item.date ? "  " : ""}
            {item.date ?? ""}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onDownload?.(item)}
          style={styles.iconHit}
          hitSlop={10}
        >
          <Ionicons name="download-outline" size={18} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleMore}
          style={styles.iconHit}
          hitSlop={10}
        >
          <Ionicons name="ellipsis-vertical" size={16} color="#6B7280" />
        </TouchableOpacity>
      </Pressable>

      {open && Platform.OS !== "ios" && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
          />
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setOpen(false);
                onDownload?.(item);
              }}
            >
              <Ionicons name="download-outline" size={16} color="#111" />
              <Text style={styles.menuText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setOpen(false);
                share();
              }}
            >
              <Ionicons name="share-outline" size={16} color="#111" />
              <Text style={styles.menuText}>Share</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const THUMB = 44;

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  index: {
    width: 22,
    textAlign: "right",
    marginRight: 10,
    color: "#6B7280",
    fontWeight: "700",
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginRight: 12,
  },
  center: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600", color: "#111" },
  meta: { marginTop: 4, fontSize: 12, color: "#6B7280" },
  iconHit: { paddingHorizontal: 8, paddingVertical: 6 },
  menu: {
    position: "absolute",
    top: 34,
    right: 6,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    paddingVertical: 6,
    minWidth: 150,
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
  menuText: { fontSize: 14, color: "#111" },
});
