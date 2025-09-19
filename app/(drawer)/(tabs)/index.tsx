// app/(drawer)/(tabs)/index.tsx (HomeScreen)
import AnimatedCard from "@/components/AnimatedCard";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import VideoComponent from "@/components/VideoScreen";
import { useGetVideosQuery } from "@/store/youtubeApi";
import notifee, { AndroidStyle } from "@notifee/react-native";
import { Image as ExpoImage } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ API + types
import { getAudioSermons } from "@/api/audio";
import { getCarousel } from "@/api/carousel";
import { colors } from "@/constants/theme";
import { useAudioPlayer } from "@/store/AudioPlayerContext";
import type { AudioSermon, CarouselItem } from "@/types";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const tabs = ["Latest", "Resources"];

// Local carousel fallback
const localCarousel = [
  { id: "local-0", image: require("@/assets/images/flow.jpg") },
  { id: "local-1", image: require("@/assets/images/flow1.png") },
];

const getBestThumb = (thumbs: any) =>
  thumbs?.maxres?.url ||
  thumbs?.standard?.url ||
  thumbs?.high?.url ||
  thumbs?.medium?.url ||
  thumbs?.default?.url;

type LocalItem = { id: string; image: any };
type RemoteItem = CarouselItem;
type CarouselDisplayItem = LocalItem | RemoteItem;

export default function HomeScreen() {
  const { data, isLoading, isError, refetch } = useGetVideosQuery(10);
  const { play } = useAudioPlayer();

  // ---------------- Carousel ----------------
  const [displayData, setDisplayData] =
    useState<CarouselDisplayItem[]>(localCarousel);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loadedIndexes, setLoadedIndexes] = useState<Set<number>>(new Set());
  const carouselRef = useRef<FlatList<any>>(null);
  const currentIndexRef = useRef(0);

  const handleImageLoaded = (index: number) => {
    setLoadedIndexes((prev) => new Set([...prev, index]));
  };

  useEffect(() => {
    (async () => {
      try {
        const remote = (await getCarousel()) || [];
        const urls = remote.map((r) => r.url).filter(Boolean);
        await Promise.all(urls.map((u) => ExpoImage.prefetch(u)));
        setDisplayData(remote as CarouselDisplayItem[]);
      } catch (e) {
        console.warn("Carousel fetch failed:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (displayData.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (carouselIndex + 1) % displayData.length;
      if (loadedIndexes.has(nextIndex)) {
        setCarouselIndex(nextIndex);
        try {
          carouselRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        } catch {}
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselIndex, displayData.length, loadedIndexes]);

  const onCarouselMomentumEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCarouselIndex(index);
    currentIndexRef.current = index;
  };

  // ---------------- Audio (API) ----------------
  const [audio, setAudio] = useState<AudioSermon[]>([]);
  const [audioLoading, setAudioLoading] = useState<boolean>(true);
  const [audioError, setAudioError] = useState<string | null>(null);

  const loadAudio = async () => {
    try {
      setAudioLoading(true);
      const rows = await getAudioSermons(1, 5);
      setAudio(rows || []);
      setAudioError(null);
    } catch (err: any) {
      console.warn("getAudioSermons failed:", err?.message || err);
      setAudioError("Failed to load audio sermons.");
    } finally {
      setAudioLoading(false);
    }
  };

  useEffect(() => {
    loadAudio();
  }, []);

  // Helper: thumbnail and playable url from API item
  const audioThumb = (a: AudioSermon) => {
    const remote =
      (a as any).thumbnailUrl ||
      (a as any).coverImageUrl ||
      (a as any).imageUrl ||
      (a as any).image ||
      (a as any).picture;

    return remote
      ? { uri: remote }
      : require("@/assets/images/aud_default.png");
  };

  const audioTitle = (a: AudioSermon) =>
    (a as any).title || (a as any).name || `Audio #${(a as any).id}`;

  const audioAuthor = (a: AudioSermon) =>
    (a as any).author ||
    (a as any).speaker ||
    (a as any).minister ||
    (a as any).preacher ||
    (a as any).createdBy ||
    (a as any).owner ||
    "";

  const audioDisplayTitle = (a: AudioSermon) => {
    const t = audioTitle(a);
    const by = audioAuthor(a);
    return by ? `${t} - ${by}` : t;
  };

  const audioStream = (a: AudioSermon) =>
    (a as any).streamUrl ||
    (a as any).fileUrl ||
    (a as any).audioUrl ||
    (a as any).url ||
    (a as any).downloadUrl;

  const handlePlayAudio = (a: AudioSermon) => {
    play({
      id: (a as any).id ?? audioTitle(a),
      title: audioTitle(a),
      author: audioAuthor(a),
      streamUrl: audioStream(a),
      downloadUrl: (a as any).downloadUrl,
      thumb: audioThumb(a),
    });
  };

  const [tabIndex, setTabIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  // ---------------- Pull-to-refresh ----------------
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch(); // videos
      await loadAudio(); // audios
      const remote = (await getCarousel()) || [];
      setDisplayData(remote as CarouselDisplayItem[]);
    } catch (e) {
      console.warn("Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // ---------------- Selected video full screen ----------------
  if (selectedVideo) {
    return (
      <VideoComponent
        item={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onSelect={(vid) => setSelectedVideo(vid)}
      />
    );
  }

  async function sendAndroidImageNotification() {
    await notifee.displayNotification({
      title: "🔔 New Alert",
      body: "This notification has an image",
      android: {
        style: {
          type: AndroidStyle.BIGPICTURE,
          picture:
            "https://purepng.com/public/uploads/large/purepng.com-mariomariofictional-charactervideo-gamefranchisenintendodesigner-1701528634653vywuz.png",
        },
      },
    });
  }

  return (
    <ScreenWrapper>
      <Header
        rightIcons={[
          {
            name: "notifications-outline",
            hasNotification: true,
            onPress: () => router.push("/notifications"),
          },
        ]}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tabButton, tabIndex === i && styles.activeTabButton]}
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
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#B61040"]}
              tintColor="#B61040"
            />
          }
        >
          {/* Carousel */}
          <View style={styles.carouselContainer}>
            <FlatList
              ref={carouselRef}
              data={displayData}
              horizontal
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={width}
              snapToAlignment="center"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onCarouselMomentumEnd}
              keyExtractor={(item, i) =>
                (item as any).id?.toString?.() ?? `c-${i}`
              }
              renderItem={({ item, index }) =>
                (item as RemoteItem).url ? (
                  <ExpoImage
                    source={{ uri: (item as RemoteItem).url }}
                    style={styles.carouselImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="disk"
                    onLoad={() => handleImageLoaded(index)}
                  />
                ) : (
                  <ExpoImage
                    source={(item as LocalItem).image}
                    style={styles.carouselImage}
                    contentFit="cover"
                    transition={150}
                    cachePolicy="disk"
                    onLoad={() => handleImageLoaded(index)}
                  />
                )
              }
            />
          </View>

          {/* Dots */}
          <View style={styles.dotsContainer}>
            {Array.from({ length: displayData.length }).map((_, i) => (
              <View
                key={`dot-${i}`}
                style={[styles.dot, carouselIndex === i && styles.activeDot]}
              />
            ))}
          </View>

          {/* Latest Video Sermon */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Video Sermon</Text>
              <TouchableOpacity onPress={() => console.log("View all videos")}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>
                  View all
                </Text>
              </TouchableOpacity>
            </View>

            {isLoading && <Loading size="large" />}
            {isError && (
              <Text style={{ color: "red" }}>Failed to load videos.</Text>
            )}

            {!isLoading && !isError && (
              <FlatList
                data={data?.items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={({ item, index }) => (
                  <AnimatedCard
                    image={getBestThumb(item.snippet.thumbnails)}
                    title={item.snippet.title}
                    shouldAnimate={index === 0}
                    onPress={() => setSelectedVideo(item)}
                  />
                )}
              />
            )}
          </View>

          {/* Latest Audio Sermon */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Audio Sermon</Text>
              <TouchableOpacity onPress={() => console.log("View all audio")}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>
                  View all
                </Text>
              </TouchableOpacity>
            </View>

            {audioLoading && <Loading size="small" />}
            {audioError && <Text style={{ color: "red" }}>{audioError}</Text>}

            {!audioLoading && !audioError && (
              <FlatList
                data={audio}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String((item as any).id)}
                renderItem={({ item, index }) => {
                  const remoteThumb =
                    (item as any).thumbnailUrl ||
                    (item as any).coverImageUrl ||
                    (item as any).imageUrl ||
                    (item as any).image ||
                    (item as any).picture;

                  return (
                    <AnimatedCard
                      image={
                        remoteThumb
                          ? { uri: remoteThumb }
                          : require("@/assets/images/aud_default.png")
                      }
                      title={audioDisplayTitle(item)}
                      shouldAnimate={index === 0}
                      onPress={() => handlePlayAudio(item)}
                      width={140}
                      height={140}
                    />
                  );
                }}
              />
            )}
          </View>

        </ScrollView>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <Text style={{ marginTop: 10, color: "#333" }}>
            Resources content will go here.
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#81808016",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 4,
  },
  activeTabButton: {
    backgroundColor: "#B61040",
  },
  tabText: {
    fontSize: 14,
    color: "#6d6c6c",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  carouselContainer: {
    paddingHorizontal: 16,
  },
  carouselImage: {
    width,
    height: 200,
    resizeMode: "cover",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#B61040",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  viewAll: {
    fontSize: 14,
    color: colors.text,
  },
});
