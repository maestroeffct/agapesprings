// components/AnimatedCard.tsx
import { useTheme } from "@/store/ThemeContext";
import React, { ReactNode } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AnimatedCardProps = {
  image: string | number | ReactNode; // 👈 now accepts ExpoImage or ReactNode
  title: string;
  onPress?: () => void;
  shouldAnimate: boolean;
  width?: number;
  height?: number;
  overlayImage?: ImageSourcePropType;
};

const RADIUS = 12;

const AnimatedCard = ({
  image,
  title,
  onPress,
  shouldAnimate,
  width = 280,
  height = 160,
  overlayImage,
}: AnimatedCardProps) => {
  const { colors, isDark } = useTheme();

  const isReactNode = React.isValidElement(image);

  return (
    <View style={[styles.cardOuter, { width }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View
          style={[
            styles.imageWrap,
            {
              height,
              backgroundColor: colors.card,
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          {isReactNode ? (
            image // 👈 render ExpoImage (or any element) directly
          ) : (
            <Image
              source={
                typeof image === "string" && image
                  ? { uri: image }
                  : (image as number) ||
                    require("@/assets/images/aud_message.png")
              }
              style={styles.image}
              resizeMode="cover"
            />
          )}

          {overlayImage ? (
            <Image
              source={overlayImage}
              style={styles.overlayBadge}
              resizeMode="contain"
            />
          ) : null}
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AnimatedCard;

const styles = StyleSheet.create({
  cardOuter: {
    marginRight: 12,
  },
  imageWrap: {
    borderRadius: RADIUS,
    overflow: "hidden",
    position: "relative",
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlayBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 46,
    height: 18,
    borderRadius: 9,
  },
  title: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
  },
});
