import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

type ProgressBarProps = {
  progress: number; // value between 0 and 1
  visible?: boolean;
  color?: string;
  height?: number;
};

export default function ProgressBar({
  progress,
  visible = true,
  color = "#3498db",
  height = 3,
}: ProgressBarProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.bar, { backgroundColor: color, height, width }]}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    // ❌ no absolute
  },
});
