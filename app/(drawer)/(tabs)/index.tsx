import AudioSection from "@/components/AudioSection";
import CarouselSection from "@/components/CarouselSection";
import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import VideoComponent from "@/components/VideoScreen";
import VideoSection from "@/components/VideoSection";
import { colors } from "@/constants/theme";
import { useAudioSermons } from "@/hooks/useAudioSermon";
import { useCarousel } from "@/hooks/useCarousel";
import { useVideoSermons } from "@/hooks/useVideoSermon";
import { useNotifications } from "@/store/NotificationContext";
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

export default function HomeScreen() {
  const { unreadCount, markAllRead } = useNotifications();
  const { refetch } = useVideoSermons();
  const { reload: reloadAudio } = useAudioSermons();
  const { reload: reloadCarousel } = useCarousel();
  const [refreshing, setRefreshing] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), reloadAudio(), reloadCarousel()]);
    setRefreshing(false);
  }, [refetch, reloadAudio, reloadCarousel]);

  if (selectedVideo)
    return (
      <VideoComponent
        item={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onSelect={setSelectedVideo}
      />
    );

  return (
    <ScreenWrapper>
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

      {tabIndex === 0 ? (
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
        </ScrollView>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <Text>Resources content will go here.</Text>
        </View>
      )}
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
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: colors.primary },
});
