// components/ThemePickerModal.tsx
import { useTheme } from "@/store/ThemeContext";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = { visible: boolean; onClose: () => void };

export default function ThemePickerModal({ visible, onClose }: Props) {
  const { themeName, setTheme, colors } = useTheme();

  // mount until exit animation finishes
  const [mounted, setMounted] = useState(visible);
  const backdrop = useRef(new Animated.Value(0)).current; // 0→1
  const contentOpacity = useRef(new Animated.Value(0)).current; // 0→1
  const translateY = useRef(new Animated.Value(24)).current; // 24→0 (slide up a bit)

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 24,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const options: { label: string; value: "light" | "dark" | "system" }[] = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "System Default", value: "system" },
  ];

  return (
    <View style={styles.portal} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdrop, backgroundColor: "rgba(0,0,0,0.45)" },
        ]}
      />
      {/* Tap outside to close (sits above backdrop, below dialog) */}
      <View style={styles.touchLayer}>
        <Pressable style={styles.absFill} onPress={onClose} />
      </View>

      {/* Centered dialog */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.centerWrap,
          { opacity: contentOpacity, transform: [{ translateY }] },
        ]}
      >
        <View style={[styles.box, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Select Theme
          </Text>

          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.option}
              activeOpacity={0.7}
              onPress={async () => {
                await setTheme(opt.value);
                onClose();
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: themeName === opt.value ? colors.primary : colors.text,
                  fontWeight: themeName === opt.value ? "700" : "400",
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  portal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  absFill: {
    ...StyleSheet.absoluteFillObject,
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 2,
  },
  box: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  option: { paddingVertical: 12 },
});
