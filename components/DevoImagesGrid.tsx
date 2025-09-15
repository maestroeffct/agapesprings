import { useTheme } from "@/store/ThemeContext";
import React from "react";
import {
  FlatList,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Loading from "./Loading";
import SearchFilterBar from "./SearchFilterButtons";

// Use the API type instead of a custom one
export type Devotional = {
  id: number;
  timePosted: string;
  headerUrl: string;
  content?: string[];
  featured?: boolean; // optional flag if you want one featured item
};

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
  query: string;
  setQuery: (v: string) => void;
  data: Devotional[];
  favIds?: number[];
  onToggleFave?: (id: number) => void;
  onPressItem?: (item: Devotional) => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export default function DevoImagesGrid({
  query,
  setQuery,
  data,
  favIds = [],
  onToggleFave,
  onPressItem,
  onEndReached,
  loadingMore = false,
  refreshing = false,
  onRefresh,
}: Props) {
  const { colors } = useTheme();

  const featured = data.find((d) => d.featured);
  const rest = data.filter((d) => !d.featured);

  return (
    <View>
      <SearchFilterBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search devotionals..."
        onPressFilter={() => {}}
      />

      <FlatList
        numColumns={2}
        data={rest}
        keyExtractor={(it) => String(it.id)}
        ListHeaderComponent={
          featured ? (
            <>
              <HeroCard
                item={featured}
                onPressItem={onPressItem}
                favIds={favIds}
                onToggleFave={onToggleFave}
              />
              <View
                style={[styles.separator, { backgroundColor: colors.subtitle }]}
              />
            </>
          ) : null
        }
        renderItem={({ item }) => (
          <GridCard
            item={item}
            onPressItem={onPressItem}
            favIds={favIds}
            onToggleFave={onToggleFave}
          />
        )}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
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
            colors={[colors.primary]} // Android
            tintColor={colors.primary} // iOS
          />
        }
      />
    </View>
  );
}

/* ---------- cards ---------- */
function HeroCard({
  item,
  favIds,
  onToggleFave,
  onPressItem,
}: {
  item: Devotional;
  favIds?: number[];
  onToggleFave?: (id: number) => void;
  onPressItem?: (it: Devotional) => void;
}) {
  const { colors } = useTheme();
  const isFav = favIds?.includes(item.id);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        onPressItem ? onPressItem(item) : console.log("Open", item.id)
      }
    >
      <ImageBackground
        source={item.headerUrl ? { uri: item.headerUrl } : imgFallback}
        style={[styles.cardBg, styles.heroRatio]}
        imageStyle={styles.cardImg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.topRow}>
          <Pill>{formatDevoDate(item.timePosted)}</Pill>
          {onToggleFave && (
            <TouchableOpacity onPress={() => onToggleFave(item.id)}>
              <Text style={{ color: isFav ? "red" : "gray" }}>
                {isFav ? "♥" : "♡"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ImageBackground>

      <Text
        style={[styles.heroTitle, { color: colors.text }]}
        numberOfLines={2}
      >
        {`Devotional ${item.id}`}
      </Text>
    </TouchableOpacity>
  );
}

function GridCard({
  item,
  favIds,
  onToggleFave,
  onPressItem,
}: {
  item: Devotional;
  favIds?: number[];
  onToggleFave?: (id: number) => void;
  onPressItem?: (it: Devotional) => void;
}) {
  const { colors } = useTheme();
  const isFav = favIds?.includes(item.id);

  return (
    <TouchableOpacity
      style={styles.gridCardWrap}
      activeOpacity={0.85}
      onPress={() =>
        onPressItem ? onPressItem(item) : console.log("Open", item.id)
      }
    >
      <ImageBackground
        source={item.headerUrl ? { uri: item.headerUrl } : imgFallback}
        style={[styles.cardBg, styles.gridRatio]}
        imageStyle={styles.cardImg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.topRow}>
          <Pill>{formatDevoDate(item.timePosted)}</Pill>
          {onToggleFave && (
            <TouchableOpacity onPress={() => onToggleFave(item.id)}>
              <Text style={{ color: isFav ? "red" : "gray" }}>
                {isFav ? "♥" : "♡"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ImageBackground>

      <Text
        style={[styles.gridTitle, { color: colors.text }]}
        numberOfLines={2}
      >
        {`Devotional ${item.id}`}
      </Text>
    </TouchableOpacity>
  );
}

/* ---------- pill ---------- */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText} numberOfLines={1}>
        {children as any}
      </Text>
    </View>
  );
}

/* ---------- styles ---------- */
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

  heroRatio: { aspectRatio: 16 / 9 },
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

  heroTitle: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 18,
    fontWeight: "800",
  },
  gridTitle: {
    marginTop: 8,
    marginBottom: 2,
    fontSize: 14,
    fontWeight: "800",
  },

  separator: {
    height: 1,
    marginHorizontal: 14,
    marginVertical: 14,
  },
});
