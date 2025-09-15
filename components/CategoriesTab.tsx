// components/CategoriesTab.tsx
import { useSelection } from "@/store/selection";
import { useTheme } from "@/store/ThemeContext";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SearchFilterBar from "./SearchFilterButtons";

type CategoryItem = {
  id: string | number;
  title: string;
  subtitle?: string;
  count?: number;
  image: any;
};

type Props = {
  onSelect?: (cat: CategoryItem) => void;
};

const CATEGORIES: CategoryItem[] = [
  {
    id: "phaneroo",
    title: "Phaneroo",
    subtitle: "Phaneroo Sermons",
    count: 538,
    image: require("@/assets/images/aud1.png"),
  },
  {
    id: "faith",
    title: "Only Believe",
    subtitle: "Sermons about Faith",
    count: 8,
    image: require("@/assets/images/aud2.png"),
  },
  {
    id: "money",
    title: "Divine Providence",
    subtitle: "Sermons about Money",
    count: 5,
    image: require("@/assets/images/aud3.png"),
  },
  {
    id: "prayer",
    title: "Prayer Codes",
    subtitle: "Prayer",
    count: 10,
    image: require("@/assets/images/aud4.png"),
  },
];

export default function CategoriesTab({ onSelect }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  useEffect(() => {
    router.prefetch("/category");
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle?.toLowerCase().includes(q)
    );
  }, [query]);

  const { setSelectedCategory } = useSelection();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <SearchFilterBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search..."
        onPressFilter={() => {}}
      />

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(it) => String(it.id)}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <Pressable
            onPressIn={() => setSelectedCategory(item)}
            onPress={() =>
              router.push({
                pathname: "/category",
                params: { item: encodeURIComponent(JSON.stringify(item)) },
              })
            }
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.card },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Image source={item.image} style={styles.image} />
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!!item.subtitle && (
              <Text
                style={[styles.subtitle, { color: colors.subtitle }]}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            )}
            {!!item.count && (
              <Text
                style={[styles.count, { color: colors.subtitle }]}
                numberOfLines={1}
              >
                {item.count} Sermons
              </Text>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.subtitle }]}>
            No categories match your search.
          </Text>
        }
      />
    </View>
  );
}

const CARD_RADIUS = 12;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingTop: 8,
  },

  // search
  searchRow: { paddingBottom: 8 },
  searchWrap: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, paddingVertical: 6 },

  // grid
  gridContent: {
    paddingBottom: 24,
    gap: 12,
  },
  column: {
    gap: 12,
  },

  card: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    padding: 8,
  },
  image: {
    width: "100%",
    height: 160,
    borderRadius: CARD_RADIUS,
    backgroundColor: "#eee",
  },
  title: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  count: {
    marginTop: 2,
    fontSize: 12,
  },

  empty: {
    textAlign: "center",
    paddingVertical: 20,
  },
});
