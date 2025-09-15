// app/audio-player/index.tsx
import AudioPlayerScreen from "@/components/AudioPlayerScreen";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function AudioPlayerRoute() {
  const { item } = useLocalSearchParams<{ item?: string }>();
  const parsed = item ? JSON.parse(decodeURIComponent(item)) : undefined;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" }, // ← no white card
          presentation: "transparentModal", // ← lets underlying screen show
          // (optional) animation tweak for Android jank:
          animation: Platform.OS === "android" ? "fade_from_bottom" : "default",
        }}
      />
      <AudioPlayerScreen
        initialItem={parsed}
        queueIndex={3}
        queueTotal={1455}
      />
    </>
  );
}
