// app/(drawer)/(tabs)/_layout.tsx
import { useTheme } from "@/store/ThemeContext";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🔹 Separate icon sets for light & dark themes
const iconsLight = {
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
    active: require("@/assets/images/onesound-active.png"),
    inactive: require("@/assets/images/onesound.png"),
  },
};

const iconsDark = {
  index: {
    active: require("@/assets/images/home-active.png"),
    inactive: require("@/assets/images/home-white.png"),
  },
  livingwaters: {
    active: require("@/assets/images/livingwaters-active.png"),
    inactive: require("@/assets/images/devotional-white.png"),
  },
  devotional: {
    active: require("@/assets/images/devotional-active.png"),
    inactive: require("@/assets/images/livingwaters-white.png"),
  },
  livingtv: {
    active: require("@/assets/images/onesound-active.png"),
    inactive: require("@/assets/images/onesound-white.png"),
  },
};

const tabConfig = {
  index: "Home",
  livingwaters: "Livingwaters",
  devotional: "Devotional",
  livingtv: "OneSound",
} as const;

type TabKey = keyof typeof tabConfig;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // pick icon set by theme
  const icons = isDark ? iconsDark : iconsLight;

  const activeColor = colors.primary;
  const inactiveColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";

  const commonTabOptions: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarActiveTintColor: activeColor,
    tabBarInactiveTintColor: inactiveColor,
    tabBarLabelStyle: {
      fontWeight: "600",
      fontSize: 12,
      marginBottom: 2,
    },
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
      borderTopWidth: StyleSheet.hairlineWidth,
      elevation: 15,
      paddingBottom: Math.max(insets.bottom, 6),
      height: 55 + insets.bottom,
    },
    tabBarButton: ({ children, style, onPress }) => (
      <TouchableOpacity
        style={[style, { paddingVertical: 4 }]}
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
              tabBarIcon: ({ focused }) => {
                const size = name === "livingtv" ? 32 : 24; // increase only livingtv
                return (
                  <Image
                    source={focused ? icons[name].active : icons[name].inactive}
                    style={{ width: size, height: size }}
                    resizeMode="contain"
                  />
                );
              },
            }}
          />
        )
      )}
    </Tabs>
  );
}
