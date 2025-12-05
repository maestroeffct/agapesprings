import MiniAudioPlayer from "@/components/MiniAudioPlayer";
import { ThemeModalProvider } from "@/components/ThemeModalHost";
import { useSocketNotifications } from "@/hooks/useSocketNotifications";
import service from "@/service";
import { store } from "@/store";
import { AudioPlayerProvider } from "@/store/AudioPlayerContext";
import { DevotionalFavesProvider } from "@/store/DevotionalFavesContext";
import { NotificationProvider } from "@/store/NotificationContext";
import { ThemeProvider } from "@/store/ThemeContext";
import { VideoProvider } from "@/store/VideoContext";
import { useMinimumVersion } from "@/store/useMinimumVersion";
import {
  listenToNotifications,
  registerForPushNotificationsAsync,
} from "@/store/notificationService";
import {
  preloadDevotionals,
  preloadDrawerScreens,
  preloadHome,
  preloadLivingwaters,
  preloadNotifications,
} from "@/utils/preload";
import * as Linking from "expo-linking";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from "react-native-track-player";
import { Provider } from "react-redux";

// Register playback service once
TrackPlayer.registerPlaybackService(() => service);

export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false); // 👈 Wait flag
  const { outdated, storeUrls } = useMinimumVersion();

  useSocketNotifications();

  useEffect(() => {
    listenToNotifications();
    registerForPushNotificationsAsync();

    // Preload data (non-blocking)
    preloadHome();
    preloadDevotionals();
    preloadNotifications();
    preloadLivingwaters();
    preloadDrawerScreens();
  }, []);

  // Handle deep links safely
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log("🔗 Received URL:", url);

      if (
        url.startsWith("trackplayer://notification.click") ||
        url.startsWith("agape:///notification.click")
      ) {
        router.replace("/audio-player");
      } else if (url.startsWith("agape:///")) {
        console.log("⚠️ Unrecognized deep link, ignoring:", url);
      }

      setReady(true); // ✅ Allow render after handling
    };

    const sub = Linking.addEventListener("url", handleDeepLink);

    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) handleDeepLink({ url: initialUrl });
      else setReady(true); // ✅ No URL, proceed normally
    })();

    return () => sub.remove();
  }, []);

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
        console.log("✅ TrackPlayer is ready");
      } catch (e) {
        console.error("TrackPlayer setup failed:", e);
      }
    };
    setupPlayer();
  }, []);

  const segments = useSegments();
  const lastSegment = segments[segments.length - 1];
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
    "onesoundDownload",
  ].includes(lastSegment);

  // ✅ Prevent rendering until deep link check completes
  if (!ready) return null;
  if (outdated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <ScreenWrapper style={{ alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              Update required
            </Text>
            <Text style={{ textAlign: "center", paddingHorizontal: 24, marginBottom: 16 }}>
              A newer version of the app is available. Please update to continue.
            </Text>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  Platform.OS === "ios"
                    ? storeUrls?.ios || "https://apps.apple.com"
                    : storeUrls?.android || "https://play.google.com"
                )
              }
              style={{
                backgroundColor: "#B61040",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Update</Text>
            </TouchableOpacity>
          </ScreenWrapper>
        </ThemeProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemeModalProvider>
          <Provider store={store}>
            <VideoProvider>
              <AudioPlayerProvider>
                <DevotionalFavesProvider>
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
                </DevotionalFavesProvider>
                {!hideMini && <MiniAudioPlayer />}
              </AudioPlayerProvider>
            </VideoProvider>
          </Provider>
        </ThemeModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
