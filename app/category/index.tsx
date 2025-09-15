import CategoryDetailScreen, {
  CategoryItem,
} from "@/components/CategoryDetailScreen";
import { useSelection } from "@/store/selection";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React from "react";

export default function CategoryRoute() {
  const { selectedCategory } = useSelection();
  const { item, id } = useLocalSearchParams<{ item?: string; id?: string }>();

  // Prefer store; fall back to param for deep links
  let parsed: any = selectedCategory ?? null;
  if (!parsed && item) {
    try {
      parsed = JSON.parse(decodeURIComponent(item));
    } catch {}
  }
  if (!parsed && id) {
    // TODO: fetch by id here if needed
  }

  if (!parsed) return null;

  const category: CategoryItem = {
    id: parsed.id ?? "cat",
    title: parsed.title ?? "Category",
    subtitle: parsed.subtitle ?? "Category Sermons",
    count: parsed.count ?? undefined,
    image: parsed.image ?? require("@/assets/images/aud1.png"),
    tags: parsed.tags,
    items: parsed.items,
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CategoryDetailScreen
        category={parsed}
        onBack={() => router.back()}
        onPlayAll={() => {}}
        onShuffleAll={() => {}}
        onPressAudio={() => {}}
        onDownloadAudio={() => {}}
      />
    </>
  );
}
