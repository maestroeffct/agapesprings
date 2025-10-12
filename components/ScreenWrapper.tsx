// components/ScreenWrapper.tsx
import { useTheme } from "@/store/ThemeContext";
import React from "react";
import { Dimensions, Platform, StatusBar, View, ViewStyle } from "react-native";

const { height } = Dimensions.get("window");

type Props = {
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
  noPadding?: boolean;
  statusBarColor?: string;
  barStyle?: "light-content" | "dark-content";
};

export default function ScreenWrapper({
  style,
  children,
  noPadding = false,
  statusBarColor,
  barStyle,
}: Props) {
  const { colors, isDark } = useTheme();
  const padTop = noPadding ? 0 : Platform.OS === "ios" ? height * 0.06 : 40;

  const _barStyle = barStyle ?? (isDark ? "light-content" : "dark-content");

  return (
    <View
      style={[
        { paddingTop: padTop, flex: 1 },
        { backgroundColor: colors.background },
        style,
      ]}
    >
      <StatusBar
        translucent
        backgroundColor={statusBarColor ?? "transparent"}
        barStyle={_barStyle}
      />
      {children}
    </View>
  );
}
