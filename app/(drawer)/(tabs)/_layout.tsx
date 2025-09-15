// app/(drawer)/(tabs)/_layout.tsx (or wherever your TabLayout lives)
import { useTheme } from "@/store/ThemeContext";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const icons = {
  index: {
    active: require("@/assets/images/home-active.png"),
    inactive: require("@/assets/images/home.png"),
  },
  livingwaters: {
    active: require("@/assets/images/livingwaters-active.png"),
    inactive: require("@/assets/images/livingwaters.png"),
  },
  devotional: {
    active: require("@/assets/images/devotional-active.png"),
    inactive: require("@/assets/images/devotional.png"),
  },
  livingtv: {
    active: require("@/assets/images/livetv-active.png"),
    inactive: require("@/assets/images/livetv.png"),
  },
} as const;

const tabConfig = {
  index: "Home",
  livingwaters: "Livingwaters",
  devotional: "Devotional",
  livingtv: "Living Stream",
} as const;

type TabKey = keyof typeof tabConfig;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const commonTabOptions: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.subtitle, // theme-aware label color
    tabBarLabelStyle: { fontWeight: "bold" },
    tabBarStyle: {
      backgroundColor: colors.card, // 👈 theme-aware background
      borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingBottom: Math.max(insets.bottom, 8),
      height: Math.max(56, 40 + insets.bottom),
    },
    tabBarButton: ({ children, style, onPress }) => (
      <TouchableOpacity
        style={[style, { paddingVertical: 6 }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    ),
  };

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {(Object.entries(tabConfig) as [TabKey, string][]).map(
        ([name, title]) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title,
              ...commonTabOptions,
              tabBarIcon: ({ focused }) => (
                <Image
                  source={focused ? icons[name].active : icons[name].inactive}
                  style={{ width: 23, height: 23 }}
                  resizeMode="contain"
                />
              ),
            }}
          />
        )
      )}
    </Tabs>
  );
}
