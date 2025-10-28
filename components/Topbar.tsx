// components/TopBar.tsx
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

// components/TopBar.tsx
export type TopBarIcon = {
  name: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean; // ✅ add this
  title?: string; // optional tooltip/text
};

type Props = {
  title?: string;
  leftIcons?: TopBarIcon[];
  rightIcons?: TopBarIcon[];
  rightGap?: number; // ✅ allow gap adjustment
  titleColor?: string;
};

export default function TopBar({
  title,
  leftIcons = [],
  rightIcons = [],
  rightGap = 8,
  titleColor,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container]}>
      {/* Left Icons */}
      <View style={styles.side}>
        {leftIcons.map((icon, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={icon.onPress}
            style={styles.hit}
            disabled={icon.disabled} // 🚀 respects disabled state
          >
            <Ionicons
              name={icon.name as any}
              size={22}
              color={
                icon.disabled ? colors.subtitle : icon.color || colors.text
              } // dim if disabled
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text
        style={[styles.title, { color: titleColor || colors.text }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      {/* Right Icons */}
      <View style={[styles.side, { columnGap: rightGap }]}>
        {rightIcons.map((icon, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={icon.onPress}
            style={styles.hit}
            disabled={icon.disabled} // 🚀 respects disabled state
          >
            <Ionicons
              name={icon.name as any}
              size={22}
              color={
                icon.disabled ? colors.subtitle : icon.color || colors.text
              } // dim if disabled
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  } as ViewStyle,
  side: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginHorizontal: 8,
  },
  hit: {
    padding: 6,
  },
});
