import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  leading?: React.ReactNode;
};

export default function PillButton({ title, onPress, style, leading }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, style, pressed && { opacity: 0.8 }]}
      onPress={onPress}
    >
      {leading}
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 14, fontWeight: "700", color: "#111827" },
});
