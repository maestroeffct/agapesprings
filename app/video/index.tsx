// app/(drawer)/video/index.tsx
import VideoScreen from "@/components/VideoScreen";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React from "react";

export default function VideoRoute() {
  const { item } = useLocalSearchParams<{ item?: string }>();

  let parsed: any = null;
  if (item) {
    try {
      parsed = JSON.parse(decodeURIComponent(item));
    } catch {}
  }

  if (!parsed) return null; // or show a loader/fallback

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <VideoScreen
        item={parsed}
        onClose={() => router.back()}
        onSelect={(next) =>
          router.push({
            pathname: "/video",
            params: { item: encodeURIComponent(JSON.stringify(next)) },
          })
        }
      />
    </>
  );
}
