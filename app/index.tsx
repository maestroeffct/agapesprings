import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { useTheme } from "@/store/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Image, StyleSheet } from "react-native";

// 👇 prevent auto-hide until we explicitly hide it
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Index() {
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    const run = async () => {
      // 👇 hide native splash as soon as possible
      await SplashScreen.hideAsync();

      const hasSeen = await AsyncStorage.getItem("hasSeenOnboarding");
      setTimeout(() => {
        router.replace(hasSeen ? "/(drawer)/(tabs)" : "/onboarding/onboarding");
      }, 1200);
    };
    run();
  }, []);

  return (
    <ScreenWrapper
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Image
        source={require("../assets/images/logo.png")}
        resizeMode="contain"
        style={styles.logo}
      />
      <Typo fontWeight="600" size={20}>
        Grace | Mindset | Profit
      </Typo>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "center", alignItems: "center" },
  logo: { aspectRatio: 1, width: 120, height: 120, marginBottom: 20 },
});
