import { colors } from "@/constants/theme";
import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type Props = {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function Chip({ label, onPress, style }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        style,
        pressed && { opacity: 0.75 },
      ]}
      onPress={onPress}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.rose,
    alignSelf: "flex-start",
  },
  text: { fontSize: 12, color: colors.primary, fontWeight: "600" },
});
