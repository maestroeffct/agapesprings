import type { Devotional } from "@/api/devotional";
import { useTheme } from "@/store/ThemeContext";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Loading from "./Loading";

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDevoDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (isSameDay(d, now)) {
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const imgFallback = require("@/assets/images/devo.jpg");

type Props = {
  data: Devotional[];
  favIds?: number[];
  onToggleFave?: (id: number, devo?: Devotional) => Promise<void> | void;
  onPressItem?: (item: Devotional) => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
};

export default function DevoImagesGrid({
  data,
  favIds = [],
  onToggleFave,
  onPressItem,
  onEndReached,
  loadingMore = false,
  refreshing = false,
  onRefresh,
  emptyMessage = "No devotionals yet.",
}: Props) {
  const { colors } = useTheme();
  const rest = data.filter((d) => !d.featured);

  return (
    <FlatList
      numColumns={2}
      data={rest}
      keyExtractor={(it) => String(it.id)}
      renderItem={({ item }) => (
        <GridCard
          item={item}
          onPressItem={onPressItem}
          favIds={favIds}
          onToggleFave={onToggleFave}
        />
      )}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={[
        styles.gridContent,
        rest.length === 0 && { flexGrow: 1, justifyContent: "center" },
      ]}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.4}
      onEndReached={onEndReached}
      ListFooterComponent={
        loadingMore ? (
          <Loading size={20} style={{ marginVertical: 12 }} />
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.subtitle }]}>
            {emptyMessage}
          </Text>
        </View>
      }
    />
  );
}

/* ---------- Card Component ---------- */
function GridCard({
  item,
  favIds,
  onToggleFave,
  onPressItem,
}: {
  item: Devotional;
  favIds?: number[];
  onToggleFave?: (id: number, devo?: Devotional) => Promise<void> | void;
  onPressItem?: (it: Devotional) => void;
}) {
  const isFav = favIds?.includes(item.id);

  // ✅ Background prefetch (non-blocking navigation)
  const handlePress = () => {
    const urls = [item.headerUrl, ...(item.content || [])].filter(
      (x): x is string => !!x && typeof x === "string"
    );

    urls.forEach((u) => ExpoImage.prefetch(u).catch(() => {})); // background prefetch
    onPressItem?.(item); // navigate immediately
  };

  return (
    <TouchableOpacity
      style={styles.gridCardWrap}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <View style={[styles.cardBg, styles.gridRatio]}>
        <ExpoImage
          source={item.headerUrl ? { uri: item.headerUrl } : imgFallback}
          placeholder={imgFallback}
          placeholderContentFit="cover"
          style={[StyleSheet.absoluteFill, styles.cardImg]}
          contentFit="cover"
          transition={0} // 🚀 instant render
          cachePolicy="memory-disk"
          recyclingKey={`grid-${item.id}`}
        />

        {/* Overlay */}
        <View style={styles.overlay} />

        {/* Top row: date + fave */}
        <View style={styles.topRow}>
          <Pill>{formatDevoDate(item.timePosted)}</Pill>
          {onToggleFave && (
            <TouchableOpacity onPress={() => onToggleFave(item.id, item)}>
              <Text style={{ color: isFav ? "red" : "gray" }}>
                {isFav ? "♥" : "♡"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ---------- Pill ---------- */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText} numberOfLines={1}>
        {children as any}
      </Text>
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  gridContent: {
    paddingHorizontal: 14,
    paddingBottom: 70,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  gridCardWrap: { width: "48%" },
  cardBg: {
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  cardImg: { borderRadius: 12 },
  gridRatio: { aspectRatio: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  topRow: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: { fontSize: 11, color: "#111", fontWeight: "700" },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: { fontSize: 14, fontWeight: "600" },
});
