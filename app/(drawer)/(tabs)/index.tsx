// app/(drawer)/(tabs)/index.tsx (HomeScreen)
import AnimatedCard from "@/components/AnimatedCard";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import VideoComponent from "@/components/VideoScreen";
import { useGetVideosQuery } from "@/store/youtubeApi";
import notifee, { AndroidStyle } from "@notifee/react-native";
import { Image as ExpoImage } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image, // for prefetch
  NativeScrollEvent,
  NativeSyntheticEvent,
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

const devotional = {
  title: "Family Series: Guarding Strength By Covering Weakness",
  verse: "1 Corinthians 13:4, 7–8 (KJV)",
  excerpt:
    "Charity suffereth long, and is kind... beareth all things, believeth all things, hopeth all things, endureth all things. Charity never fai...",
  date: "9 Jul, 2025",
  tag: "Family Series",
  image: require("@/assets/images/devo.jpg"),
};

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
  const { data, isLoading, isError } = useGetVideosQuery(10);
  const { play } = useAudioPlayer(); // 👈 to start audio

  // ---------------- Carousel ----------------
  const [displayData, setDisplayData] =
    useState<CarouselDisplayItem[]>(localCarousel);
  const [loadingRemote, setLoadingRemote] = useState(true);

  const [tabIndex, setTabIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList<any>>(null);
  const currentIndexRef = useRef(0);

  // viewability for rails
  const [visibleVideoItems, setVisibleVideoItems] = useState<number[]>([]);
  const [visibleAudioItems, setVisibleAudioItems] = useState<number[]>([]);
  const [visibleTestimonyItems, setVisibleTestimonyItems] = useState<number[]>(
    []
  );
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const onVideoViewableItemsChanged = useRef(({ viewableItems }: any) => {
    setVisibleVideoItems(viewableItems.map((vi: any) => vi.index));
  }).current;

  const onAudioViewableItemsChanged = useRef(({ viewableItems }: any) => {
    setVisibleAudioItems(viewableItems.map((vi: any) => vi.index));
  }).current;

  const onTestimonyViewableItemsChanged = useRef(({ viewableItems }: any) => {
    setVisibleTestimonyItems(viewableItems.map((vi: any) => vi.index));
  }).current;

  const viewabilityConfig = useRef({
    waitForInteraction: false,
    itemVisiblePercentThreshold: 1,
    minimumViewTime: 0,
  }).current;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const remote = (await getCarousel()) || [];
        const urls = remote.map((r) => r.url).filter(Boolean);
        await Promise.all(urls.map((u) => Image.prefetch(u)));
        if (!mounted) return;
        setDisplayData(remote as CarouselDisplayItem[]);
        setTimeout(() => {
          try {
            carouselRef.current?.scrollToIndex({
              index: Math.min(currentIndexRef.current, remote.length - 1),
              animated: false,
            });
          } catch {}
        }, 0);
      } catch (e) {
        console.warn("Carousel remote fetch/prefetch failed:", e);
      } finally {
        mounted && setLoadingRemote(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const total = displayData.length;
    if (total <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (carouselIndex + 1) % total;
      setCarouselIndex(nextIndex);
      try {
        carouselRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselIndex, displayData.length]);

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

  useEffect(() => {
    let alive = true;
    setAudioLoading(true);
    getAudioSermons(1, 5)
      .then((rows) => {
        if (!alive) return;
        setAudio(rows || []);
        setAudioError(null);
      })
      .catch((err) => {
        if (!alive) return;
        console.warn("getAudioSermons failed:", err?.message || err);
        setAudioError("Failed to load audio sermons.");
      })
      .finally(() => alive && setAudioLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Helper: thumbnail and playable url from API item
  const audioThumb = (a: AudioSermon) =>
    // try several common fields, fallback image
    (a as any).thumbnailUrl ||
    (a as any).coverImageUrl ||
    (a as any).imageUrl ||
    (a as any).image ||
    (a as any).picture ||
    require("@/assets/images/aud1.png");

  const audioTitle = (a: AudioSermon) =>
    (a as any).title || (a as any).name || `Audio #${(a as any).id}`;

  // NEW: robust author lookup across possible API fields
  const audioAuthor = (a: AudioSermon) =>
    (a as any).author ||
    (a as any).speaker ||
    (a as any).minister ||
    (a as any).preacher ||
    (a as any).createdBy ||
    (a as any).owner ||
    "";

  // NEW: final title shown on the card
  const audioDisplayTitle = (a: AudioSermon) => {
    const t = audioTitle(a);
    const by = audioAuthor(a);
    return by ? `${t} - ${by}` : t; // ← "title - author"
  };

  const audioStream = (a: AudioSermon) =>
    // try stream/file fields
    (a as any).streamUrl ||
    (a as any).fileUrl ||
    (a as any).audioUrl ||
    (a as any).url ||
    (a as any).downloadUrl;

  const handlePlayAudio = (a: AudioSermon) => {
    const title = audioTitle(a);
    const author = audioAuthor(a); // ✅ use your robust author picker
    const streamUrl = audioStream(a);

    play({
      id: (a as any).id ?? title,
      title,
      author, // ✅ pass the author
      streamUrl,
      downloadUrl: (a as any).downloadUrl,
      thumb:
        typeof audioThumb(a) === "string"
          ? { uri: audioThumb(a) }
          : audioThumb(a), // ✅ normalize thumb into { uri }
    });
  };

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
            "https://purepng.com/public/uploads/large/purepng.com-mariomariofictional-charactervideo-gamefranchisenintendodesigner-1701528634653vywuz.png", // or local file path
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
        >
          {/* Carousel */}
          <View style={styles.carouselContainer}>
            <FlatList
              ref={carouselRef}
              data={displayData}
              horizontal
              pagingEnabled
              decelerationRate="fast" // 👈 makes swipe settle quickly
              snapToInterval={width} // 👈 snap exactly one screen width
              snapToAlignment="center"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onCarouselMomentumEnd}
              keyExtractor={(item, i) =>
                (item as any).id?.toString?.() ?? `c-${i}`
              }
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              renderItem={({ item }) =>
                (item as RemoteItem).url ? (
                  <ExpoImage
                    source={{ uri: (item as RemoteItem).url }}
                    style={styles.carouselImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="disk"
                  />
                ) : (
                  <ExpoImage
                    source={(item as LocalItem).image}
                    style={styles.carouselImage}
                    contentFit="cover"
                    transition={150}
                    cachePolicy="disk"
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

          {/* Today’s Devotional (unchanged) */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Todays Devotional</Text>
            <View style={styles.card}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{devotional.title}</Text>
                <Text style={styles.cardVerse}>{devotional.verse}</Text>
                <Text style={styles.cardExcerpt}>{devotional.excerpt}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>{devotional.date}</Text>
                  <View style={styles.cardTag}>
                    <Text style={styles.cardTagText}>{devotional.tag}</Text>
                  </View>
                </View>
              </View>
              <ExpoImage source={devotional.image} style={styles.cardImage} />
            </View>
          </View> */}

          {/* Latest Video Sermon (unchanged) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Video Sermon</Text>
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
                    shouldAnimate={visibleVideoItems.includes(index)}
                    onPress={() => setSelectedVideo(item)}
                  />
                )}
                onViewableItemsChanged={onVideoViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
              />
            )}
          </View>

          {/* ✅ Latest Audio Sermon (NOW USING API) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Audio Sermon</Text>
              <TouchableOpacity onPress={() => console.log("View all audio")}>
                <Text style={styles.viewAll}>View all</Text>
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
                renderItem={({ item, index }) => (
                  <AnimatedCard
                    image={audioThumb(item)}
                    title={audioDisplayTitle(item)}
                    shouldAnimate={visibleAudioItems.includes(index)}
                    onPress={() => handlePlayAudio(item)}
                    width={140}
                    height={140}
                  />
                )}
                onViewableItemsChanged={onAudioViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
              />
            )}
          </View>

          {/* Testimony (unchanged) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Testimony</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View all</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={[
                {
                  id: 1,
                  image: require("@/assets/images/aud4.png"),
                  title: "10years Glaucoma Healed — FEB 07, 2023",
                },
                {
                  id: 2,
                  image: require("@/assets/images/aud3.png"),
                  title: "10years Glaucoma Healed",
                },
                {
                  id: 3,
                  image: require("@/assets/images/aud2.png"),
                  title: "Another Healing Testimony",
                },
              ]}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `${item.id}`}
              renderItem={({ item, index }) => (
                <AnimatedCard
                  image={item.image}
                  title={item.title}
                  shouldAnimate={visibleTestimonyItems.includes(index)}
                  onPress={() => sendAndroidImageNotification()} // 👈 send test notification
                />
              )}
              onViewableItemsChanged={onTestimonyViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
            />
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
  card: {
    marginTop: 10,
    flexDirection: "row",
    backgroundColor: "#fceef2",
    borderRadius: 8,
    padding: 10,
  },
  cardText: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  cardVerse: {
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 4,
  },
  cardExcerpt: {
    fontSize: 12,
    color: "#444",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: {
    fontSize: 12,
    color: "#666",
  },
  cardTag: {
    borderWidth: 1,
    borderColor: "#B61040",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardTagText: {
    fontSize: 10,
    color: "#B61040",
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
});
