import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Devotional, getDevotionalById } from "@/api/devotional";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useDevotionalFaves } from "@/store/DevotionalFavesContext";
import { useTheme } from "@/store/ThemeContext";
import {
  getCachedDevotionals,
  saveDevotionalToCache,
} from "@/store/devotionalCache";
import { getFavedIds, toggleFave } from "@/store/devotionalFaves";
import {
  getDownloadedDevotionals,
  saveDownloadedDevotional,
} from "@/utils/devotionalDownloads";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import ImageViewing from "react-native-image-viewing";

/* Normalize content into clean string[] of image URLs */
function normalizeContent(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((x): x is string => typeof x === "string" && !!x);
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed))
        return parsed.filter((x): x is string => typeof x === "string" && !!x);
    } catch {}
    const urls =
      input.match(
        /https?:\/\/[^\s"'()<>]+?\.(?:png|jpe?g|gif|webp)(?:\?[^\s"'()<>=]*)?/gi
      ) || [];
    return urls;
  }
  return [];
}

export default function DevotionalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { refresh: refreshFavesGlobal } = useDevotionalFaves();

  const devoId = useMemo(() => Number(id), [id]);
  const [devo, setDevo] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const [downloadProgress, setDownloadProgress] = useState({
    done: 0,
    total: 0,
  });

  /* ---------- Load cache + refresh ---------- */
  useEffect(() => {
    if (!devoId) return;
    let active = true;

    (async () => {
      const cached = await getCachedDevotionals();
      const fromCache = cached.find((d) => d.id === devoId);
      if (fromCache && active) {
        setDevo({
          ...fromCache,
          content: normalizeContent((fromCache as any).content),
        });
        setLoading(false);
      }

      getDevotionalById(devoId)
        .then(async (res) => {
          if (!active || !res) return;
          const normalized = {
            ...res,
            content: normalizeContent((res as any).content),
          };
          setDevo(normalized);
          await saveDevotionalToCache(normalized);
        })
        .catch(() => {})
        .finally(() => {
          if (!fromCache) setLoading(false);
        });
    })();

    return () => {
      active = false;
    };
  }, [devoId]);

  /* ---------- Check downloaded ---------- */
  useEffect(() => {
    if (!devoId) return;
    (async () => {
      const downloads = await getDownloadedDevotionals();
      setDownloaded(downloads.some((d) => d.id === devoId));
    })();
  }, [devoId]);

  /* ---------- Favourites ---------- */
  useEffect(() => {
    (async () => {
      const ids = await getFavedIds();
      setIsFav(ids.includes(devoId));
    })();
  }, [devoId]);

  const handleToggleFave = async () => {
    if (!devo) return;
    setIsFav((prev) => !prev);
    try {
      const updated = await toggleFave(devoId, devo);
      setIsFav(updated.includes(devoId));
      refreshFavesGlobal();
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- Download images ---------- */
  const handleDownload = async () => {
    if (!devo || downloaded)
      return Alert.alert(
        "Already downloaded",
        "This devotional has already been downloaded."
      );
    const allImages = [devo.headerUrl, ...(devo.content || [])].filter(Boolean);
    if (!allImages.length)
      return Alert.alert("No images", "No images to download.");

    setDownloading(true);
    setDownloadProgress({ done: 0, total: allImages.length });

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        setDownloading(false);
        return;
      }

      const savedUris: string[] = [];
      for (let i = 0; i < allImages.length; i++) {
        const fileUri =
          FileSystem.documentDirectory + `devotional-${devo.id}-${i + 1}.jpg`;
        const { uri } = await FileSystem.downloadAsync(allImages[i]!, fileUri);
        savedUris.push(uri);
        await MediaLibrary.createAssetAsync(uri);
        setDownloadProgress({ done: i + 1, total: allImages.length });
      }

      await saveDownloadedDevotional({
        id: devo.id,
        images: savedUris,
        timestamp: Date.now(),
      });
      setDownloaded(true);
      Alert.alert("Downloaded", `Saved ${savedUris.length} images.`);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to download images.");
    } finally {
      setDownloading(false);
    }
  };

  /* ---------- Image viewer ---------- */
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const allImages = devo ? [devo.headerUrl, ...(devo.content || [])] : [];

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  /* ---------- Loading / Not Found ---------- */
  if (loading && !devo)
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Loading size={40} />
        </View>
      </ScreenWrapper>
    );
  if (!devo)
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Devotional not found</Text>
        </View>
      </ScreenWrapper>
    );

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      <TopBar
        title={`Devotional ${devo.id}`}
        leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
        rightIcons={[
          {
            name: isFav ? "heart" : "heart-outline",
            onPress: handleToggleFave,
            color: isFav ? "red" : colors.text,
          },
          {
            name: "download-outline",
            onPress: handleDownload,
            disabled: downloading,
            color: downloading || downloaded ? colors.subtitle : colors.text,
            title: downloading
              ? `Downloading ${downloadProgress.done}/${downloadProgress.total}`
              : downloaded
              ? "Already downloaded"
              : undefined,
          },
        ]}
        rightGap={10}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {allImages.map((uri, idx) => {
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.9}
              onPress={() => openViewer(idx)}
            >
              <View style={idx === 0 ? styles.headerImg : styles.contentImg}>
                {imgLoading && (
                  <View style={styles.imageLoader}>
                    <Loading size={30} />
                  </View>
                )}
                <ExpoImage
                  source={{ uri }}
                  style={StyleSheet.absoluteFill}
                  contentFit={idx === 0 ? "cover" : "contain"}
                  transition={0}
                  cachePolicy="memory-disk"
                  recyclingKey={`devo-${devo.id}-${idx}`}
                  onLoadStart={() => setImgLoading(true)}
                  onLoadEnd={() => setImgLoading(false)}
                />
              </View>
            </TouchableOpacity>
          );
        })}
        {allImages.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.subtitle }]}>
            <Loading size={30} />
          </Text>
        )}
      </ScrollView>

      <ImageViewing
        images={allImages.map((uri) => ({ uri }))}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
    paddingBottom: 24,
    paddingHorizontal: 12,
  },
  headerImg: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  contentImg: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 13, fontWeight: "600" },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0", // optional placeholder background
  },
});
