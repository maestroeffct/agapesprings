import Loading from "@/components/Loading"; // 👈 import your Loading component
import ProgressBar from "@/components/ProgressBar";
import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useTheme } from "@/store/ThemeContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export default function AboutUsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const handleProgress = (event: any) => {
    const value = event.nativeEvent.progress; // 0 → 1
    setProgress(value);
    setVisible(true);
    if (value === 1) {
      setTimeout(() => setVisible(false), 400);
    }
  };

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      statusBarColor={colors.background}
      barStyle={
        colors.background === "#111827" ? "light-content" : "dark-content"
      }
    >
      {/* ✅ Header wrapper */}
      <View>
        <TopBar
          title="About Us"
          leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
        />
        <ProgressBar
          progress={progress}
          visible={visible}
          color={colors.primary}
        />
      </View>

      {/* WebView content */}
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: "https://www.agapespringsint.com/about" }}
          style={styles.webview}
          onLoadProgress={handleProgress}
        />

        {/* ✅ Centered loader overlay */}
        {visible && (
          <View style={styles.loadingOverlay}>
            <Loading size="large" />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, // full overlay
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)", // 👈 slight dim (optional)
  },
});
