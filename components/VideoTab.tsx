import { useTheme } from "@/store/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import SearchFilterBar from "./SearchFilterButtons";
import VideosList from "./VideoList";

type Props = {
  query: string;
  onChangeQuery: (q: string) => void;
  onSelectVideo?: (item: any) => void;
};

export default function VideoTab({
  query,
  onChangeQuery,
  onSelectVideo,
}: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <SearchFilterBar
        value={query}
        onChangeText={onChangeQuery}
        placeholder="Search videos..."
        onPressFilter={() => {}}
      />

      {/* Video List */}
      <VideosList query={query} onSelect={onSelectVideo} />
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 6,
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  searchWrap: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 6 },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
