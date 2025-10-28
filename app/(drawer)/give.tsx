import Loading from "@/components/Loading";
import ProgressBar from "@/components/ProgressBar";
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useTheme } from "@/store/ThemeContext";
import { getCachedPage, urls } from "@/utils/prefetchWebPages";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export default function GiveScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [cachedHtml, setCachedHtml] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [webKey, setWebKey] = useState(0);

  const handleProgress = (event: any) => {
    const value = event.nativeEvent.progress;
    setProgress(value);
    setVisible(true);
    if (value === 1) setTimeout(() => setVisible(false), 400);
  };

  useEffect(() => {
    (async () => {
      const html = await getCachedPage("give");
      if (html) setCachedHtml(html);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setWebKey((prev) => prev + 1);
    setRefreshing(false);
  };

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      statusBarColor={colors.background}
      barStyle={
        colors.background === "#111827" ? "light-content" : "dark-content"
      }
    >
      <View>
        <TopBar
          title="Give"
          leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
        />
        <ProgressBar
          progress={progress}
          visible={visible}
          color={colors.primary}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={{ flex: 1 }}>
          <WebView
            key={webKey}
            source={
              cachedHtml
                ? { html: cachedHtml, baseUrl: urls.give }
                : { uri: urls.give }
            }
            style={styles.webview}
            onLoadProgress={handleProgress}
          />
          {visible && (
            <View style={styles.loadingOverlay}>
              <Loading size="large" />
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1, minHeight: 800 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
});
