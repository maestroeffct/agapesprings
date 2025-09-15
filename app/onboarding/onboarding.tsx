// app/onboarding/onboarding.tsx
import Button from "@/components/Button";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { useTheme } from "@/store/ThemeContext";
import { scale, verticalScale } from "@/utils/styling";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    key: "1",
    title: "GRACE",
    subtitle: "Our Mindset",
    image: require("@/assets/images/screen1.png"),
  },
  {
    key: "2",
    title: "PROFITING",
    subtitle: "Our Lifestyle",
    image: require("@/assets/images/screen2.png"),
  },
  {
    key: "3",
    title: "LOVE & POWER",
    subtitle: "Experience Jesus in his love and power",
    image: require("@/assets/images/screen3.png"),
  },
];

const Onboarding = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Reset values
    fadeAnim.setValue(0);
    translateAnim.setValue(20);

    // Animate both opacity and translateY
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex]);

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x /
        event.nativeEvent.layoutMeasurement.width
    );
    setCurrentIndex(index);
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.replace("/(drawer)/(tabs)");
    }
  };

  const renderSubtitle = (subtitle: string, index: number) => {
    if (index === 2) return subtitle; // full sentence for last slide
    const [first, second] = subtitle.split(" ");
    return (
      <>
        {first} <Text style={{ color: colors.primary }}>{second}</Text>
      </>
    );
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: (typeof slides)[0];
    index: number;
  }) => {
    const isActive = index === currentIndex;

    return (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.bgImage} contentFit="cover" />

        {/* Skip button (hide on last slide) */}
        {currentIndex !== slides.length - 1 && isActive && (
          <TouchableOpacity
            style={styles.skip}
            onPress={async () => {
              await AsyncStorage.setItem("hasSeenOnboarding", "true");
              router.replace("/(drawer)/(tabs)");
            }}
          >
            <Text style={[styles.skipText, { color: colors.white }]}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Render content only for the active slide */}
        {isActive && (
          <Animated.View
            key={currentIndex}
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
              },
            ]}
          >
            <Text style={[styles.heading, { color: colors.white }]}>
              {item.title}
            </Text>
            <Text style={[styles.sub, { color: colors.white }]}>
              {renderSubtitle(item.subtitle, index)}
            </Text>

            <View style={styles.dotsContainer}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: colors.white, opacity: 0.5 },
                    i === currentIndex && {
                      backgroundColor: colors.primary,
                      opacity: 1,
                    },
                  ]}
                />
              ))}
            </View>

            <Button
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={handleNext}
            >
              <Typo color={colors.white} fontWeight="600">
                {currentIndex === slides.length - 1 ? "GET STARTED" : "NEXT"}
              </Typo>
            </Button>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper
      statusBarColor="transparent"
      barStyle="light-content"
      style={{ backgroundColor: colors.background }}
    >
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />
    </ScreenWrapper>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  slide: {
    width,
    height,
    position: "relative",
  },
  bgImage: {
    width: "100%",
    height: "120%",
    position: "absolute",
  },
  skip: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 2,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 35,
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  sub: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 70,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(40),
    borderRadius: scale(8),
    minWidth: width * 0.9,
    alignItems: "center",
  },
});
