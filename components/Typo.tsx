// components/Typo.tsx
import { useTheme } from "@/store/ThemeContext";
import { TypoProps } from "@/types";
import { verticalScale } from "@/utils/styling";
import React from "react";
import { StyleSheet, Text, TextStyle } from "react-native";

const Typo = ({
  size,
  color,
  fontWeight = "400",
  children,
  style,
  textProps = {},
}: TypoProps & { color?: string }) => {
  const { colors } = useTheme();

  const textStyle: TextStyle = {
    fontSize: size ? verticalScale(size) : verticalScale(18),
    color: color || colors.text,
    fontWeight,
  };
  return (
    <Text style={[textStyle, style]} {...textProps}>
      {children}
    </Text>
  );
};

export default Typo;
const styles = StyleSheet.create({});
