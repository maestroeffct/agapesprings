import AudioRowCompact, { AudioRowItem } from "@/components/AudioRowCompact";
import ScreenWrapper from "@/components/ScreenWrapper";
import Chip from "@/components/ui/Chip";
import PillButton from "@/components/ui/PillButton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type CategoryItem = {
  id: string | number;
  title: string;
  subtitle?: string;
  count?: number;
  image: any;
  tags?: string[];
  items?: AudioRowItem[];
};

type Props = {
  category: CategoryItem;
  onBack: () => void;
  onPlayAll?: () => void;
  onShuffleAll?: () => void;
  onPressAudio?: (it: AudioRowItem) => void;
  onDownloadAudio?: (it: AudioRowItem) => void;
};

export default function CategoryDetailScreen({
  category,
  onBack,
  onPlayAll,
  onShuffleAll,
  onPressAudio,
  onDownloadAudio,
}: Props) {
  const tags = category.tags ?? [
    "Language",
    "Overcomer",
    "My Great Price Women’s Conference 2025",
    "Yielding Your Spirit",
    "Glory",
    "Wisdom",
    "Work",
    "Believing Without Seeing",
  ];

  // demo list if none provided
  const items: AudioRowItem[] = category.items ?? [
    {
      id: "1",
      title: "Authority In The Life",
      size: "21MB",
      date: "25 May, 2017",
      thumb: require("@/assets/images/aud1.png"),
    },
    {
      id: "2",
      title: "The Renewed Mind",
      size: "21MB",
      date: "18 May, 2017",
      thumb: require("@/assets/images/aud2.png"),
    },
    {
      id: "3",
      title: "The Dream: What No Eye Has Seen",
      size: "22MB",
      date: "11 May, 2017",
      thumb: require("@/assets/images/aud3.png"),
    },
    {
      id: "4",
      title: "Run To The Waters",
      size: "26MB",
      date: "4 May, 2017",
      thumb: require("@/assets/images/aud4.png"),
    },
    {
      id: "5",
      title: "The Time Dimension",
      size: "23MB",
      date: "27 Apr, 2017",
      thumb: require("@/assets/images/aud1.png"),
    },
  ];

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.backHit}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.topTitle} numberOfLines={1}>
            {category.title}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Bottom-only shadow */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0)"]}
          style={styles.bottomOnlyShadow}
        />
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Image source={category.image} style={styles.heroImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.catTitle}>{category.title}</Text>
          {!!category.subtitle && (
            <Text style={styles.catSub}>{category.subtitle}</Text>
          )}
          {!!category.count && (
            <Text style={styles.catCount}>{category.count} Sermons</Text>
          )}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.btnRow}>
        <PillButton
          title="Shuffle All"
          leading={<Ionicons name="shuffle" size={16} color="#111827" />}
          onPress={onShuffleAll}
          style={{ flex: 1, backgroundColor: "#E5E7EB" }}
        />
        <PillButton
          title="Play All"
          leading={<Ionicons name="play" size={16} color="#111827" />}
          onPress={onPlayAll}
          style={{ flex: 1, backgroundColor: "#E5E7EB" }}
        />
      </View>

      {/* Tags */}
      <View style={styles.tagsWrap}>
        {tags.map((t, i) => (
          <Chip key={`${t}-${i}`} label={t} style={styles.tagChip} />
        ))}
      </View>

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <AudioRowCompact
            index={index + 1}
            item={item}
            onPress={onPressAudio}
            onDownload={onDownloadAudio}
          />
        )}
        contentContainerStyle={{ paddingBottom: 28 }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // ⬇️ shadow container so the shadow renders cleanly edge-to-edge
  headerWrap: {
    position: "relative",
    backgroundColor: "#fff",
  },
  topBar: {
    height: 50,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  backHit: { padding: 6, marginRight: 8 },
  topTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#111" },

  // ← this draws a soft fade only BELOW the header
  bottomOnlyShadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -1,
    height: 10,
  },
  hero: {
    paddingHorizontal: 14,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  catTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  catSub: { marginTop: 4, fontSize: 13, color: "#6B7280" },
  catCount: { marginTop: 4, fontSize: 13, color: "#6B7280", fontWeight: "600" },

  btnRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  // ⬇️ center each wrapped line of chips
  /* (optional) center the chips like in your screenshot */
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center", // center
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  tagChip: {
    marginHorizontal: 3,
    marginVertical: 3,
  },

  sep: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 14 },
});
