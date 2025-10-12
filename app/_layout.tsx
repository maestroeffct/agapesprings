import MiniAudioPlayer from "@/components/MiniAudioPlayer";
import { ThemeModalProvider } from "@/components/ThemeModalHost";
import service from "@/service"; // 👈 make sure the path is correct
import { store } from "@/store";
import { AudioPlayerProvider } from "@/store/AudioPlayerContext";
import { NotificationProvider } from "@/store/NotificationContext";
import { registerForPushNotificationsAsync } from "@/store/notificationService";
import { ThemeProvider } from "@/store/ThemeContext";
import { VideoProvider } from "@/store/VideoContext";
import {
  preloadDevotionals,
  preloadDrawerScreens,
  preloadHome,
  preloadLivingwaters,
  preloadNotifications,
} from "@/utils/preload";
import * as Linking from "expo-linking";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // 👈 import
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from "react-native-track-player";
import { Provider } from "react-redux";

// register once
TrackPlayer.registerPlaybackService(() => service);
export default function RootLayout() {
  useEffect(() => {
    // fire and forget – no blocking
    preloadHome();
    preloadDevotionals();
    preloadNotifications();
    preloadLivingwaters();
    preloadDevotionals();
    preloadDrawerScreens();
  }, []);

  const router = useRouter();

  useEffect(() => {
    const setupPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer();

        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
          compactCapabilities: [Capability.Play, Capability.Pause],
          notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
          icon: require("../assets/images/notification.png"),

          android: {
            appKilledPlaybackBehavior:
              AppKilledPlaybackBehavior.ContinuePlayback,
            alwaysPauseOnInterruption: true,
          },
        });

        console.log("✅ TrackPlayer is set up with background controls");
      } catch (error) {
        console.error("Error setting up TrackPlayer:", error);
      }
    };

    setupPlayer();

    return () => {
      TrackPlayer.reset();
    };
  }, []);

  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      const { path } = Linking.parse(url);

      if (path === "notification.click") {
        // 👇 redirect notification taps to your player screen
        router.push("/audio-player");
      }

      if (path === "audio-player") {
        router.push("/audio-player");
      }
    });

    return () => sub.remove();
  }, []);

  // const segments = useSegments();
  // const hideMini = [
  //   "(drawer)",
  //   "audio-player",
  //   "queue",
  //   "downloads",
  //   "aboutus",
  //   "give",
  //   "settings",
  //   "share",
  //   "platform",
  //   "/video",
  // ].includes(segments[0]);
  const segments = useSegments();
  const lastSegment = segments[segments.length - 1]; // Get the actual screen
  const hideMini = [
    "audio-player",
    "queue",
    "downloads",
    "(drawer)",
    "aboutus",
    "give",
    "settings",
    "share",
    "platform",
    "/video",
    "CustomDrawer",
  ].includes(lastSegment);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemeModalProvider>
          <Provider store={store}>
            <VideoProvider>
              <AudioPlayerProvider>
                <NotificationProvider>
                  <Stack
                    initialRouteName="(drawer)"
                    screenOptions={{ headerShown: false }}
                  >
                    <Stack.Screen
                      name="(drawer)"
                      options={{ headerShown: false }}
                    />
                  </Stack>
                </NotificationProvider>
                {!hideMini && <MiniAudioPlayer />}
              </AudioPlayerProvider>
            </VideoProvider>
          </Provider>
        </ThemeModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
