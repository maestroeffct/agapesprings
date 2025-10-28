import AudioSection from "@/components/AudioSection";
import CarouselSection from "@/components/CarouselSection";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import TestimonySection from "@/components/TestimonySection";
import VideoComponent from "@/components/VideoScreen";
import VideoSection from "@/components/VideoSection";
import { colors } from "@/constants/theme";
import { useAudioSermons } from "@/hooks/useAudioSermon";
import { useCarousel } from "@/hooks/useCarousel";
import { useTestimonies } from "@/hooks/useTestimonies";
import { useVideoSermons } from "@/hooks/useVideoSermon";
import { useNotifications } from "@/store/NotificationContext";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useState } from "react";

import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function HomeScreen() {
  const { unreadCount, markAllRead } = useNotifications();
  const { reload } = useVideoSermons();
  const { reload: reloadAudio } = useAudioSermons();
  const { reload: reloadCarousel } = useCarousel();

  const [refreshing, setRefreshing] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [webKey, setWebKey] = useState(0);
  const { reload: reloadTestimonies } = useTestimonies();

  // Helper function to schedule notifications
  const scheduleDailyNotification = async (
    id: string,
    title: string,
    body: string,
    hour: number,
    minute: number,
    repeat: boolean = true,
    weekday?: number, // optional: 0=Sun, 1=Mon, ..., 6=Sat
    data?: any
  ) => {
    // Cancel previous with same id
    await Notifications.cancelScheduledNotificationAsync(id);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: {
        hour,
        minute,
        repeats: repeat,
        // Weekday-based trigger handled inside listener below
      },
    });
  };

  // Only refresh when on Latest tab
  const onRefresh = useCallback(async () => {
    if (tabIndex !== 0) return;
    setRefreshing(true);
    try {
      await Promise.all([
        reload(),
        reloadAudio(),
        reloadCarousel(),
        reloadTestimonies(),
      ]);
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setRefreshing(false);
    }
  }, [tabIndex, reload, reloadAudio, reloadCarousel, reloadTestimonies]);

  if (selectedVideo)
    return (
      <VideoComponent
        item={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onSelect={setSelectedVideo}
      />
    );

  return (
    <ScreenWrapper style={{ flex: 1 }}>
      <Header
        rightIcons={[
          {
            name: "notifications-outline",
            hasNotification: unreadCount > 0,
            onPress: () => {
              markAllRead();
              router.push("/notifications");
            },
          },
        ]}
      />

      <View style={styles.tabs}>
        {["Latest", "Resources"].map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tabBtn, tabIndex === i && styles.activeTab]}
            onPress={() => setTabIndex(i)}
          >
            <Text
              style={[styles.tabText, tabIndex === i && styles.activeTabText]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: tabIndex === 0 ? "flex" : "none" }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
          >
            <CarouselSection />
            <VideoSection onSelect={setSelectedVideo} />
            <AudioSection />
            <TestimonySection onSelect={setSelectedVideo} />
          </ScrollView>
        </View>

        <View style={{ flex: 1, display: tabIndex === 1 ? "flex" : "none" }}>
          <ScrollView
            contentContainerStyle={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  try {
                    setWebKey((prev) => prev + 1);
                  } finally {
                    setRefreshing(false);
                  }
                }}
                colors={[colors.primary]}
              />
            }
          >
            <WebView
              key={webKey}
              source={{ uri: "https://www.agapespringsint.com/resources" }}
              style={{ flex: 1, minHeight: 800 }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingView}>
                  <Loading size={35} />
                </View>
              )}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
            />
          </ScrollView>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    backgroundColor: "rgba(129,128,128,0.09)",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 4,
  },
  activeTab: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, color: "#6d6c6c" },
  activeTabText: { color: "#fff", fontWeight: "bold" },
  loadingView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
