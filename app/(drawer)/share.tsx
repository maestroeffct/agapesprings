import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { useTheme } from "@/store/ThemeContext";
import { useRouter } from "expo-router";
import React from "react";
import { Button, Share, StyleSheet, View } from "react-native";

export default function ShareScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleShare = async () => {
    try {
      const result = await Share.share({
        title: "AgapeSprings App",
        message:
          "🌟 Check out the Agapesprings International Ministries app! \n\nDownload here @ https://play.google.com/store/apps/details?id=com.maestro_effect.agapesprings&pcampaignid=web_share",
        url: "https://play.google.com/store/apps/details?id=com.maestro_effect.agapesprings&pcampaignid=web_share", // iOS uses this too
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("Shared with activity type:", result.activityType);
        } else {
          console.log("App shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      console.error("Share failed:", error);
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
      <TopBar
        title="Share App"
        leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
      />

      <View style={styles.container}>
        <Button
          color={colors.primary}
          title="Share App Now"
          onPress={handleShare}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
