// components/Header.tsx
import { useTheme } from "@/store/ThemeContext";
import { ExtendedHeaderProps } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import React from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

const Header: React.FC<ExtendedHeaderProps> = ({ rightIcons = [] }) => {
  const navigation = useNavigation();
  const { colors, themeName } = useTheme(); // 👈 grab theme colors
  const logoSource =
    themeName === "dark"
      ? require("@/assets/images/logo_white.png") // dark mode
      : require("@/assets/images/logo_name.png"); // light mode
  return (
    <View style={[styles.container]}>
      {/* Left side: Menu & Logo */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={27} color={colors.text} />
        </TouchableOpacity>
        <Image source={logoSource} style={styles.logo} />
      </View>

      {/* Right side: dynamic icons */}
      <View style={styles.rightSection}>
        {rightIcons.map((icon, idx) => (
          <TouchableOpacity key={idx} onPress={icon.onPress}>
            <View style={styles.iconWrapper}>
              {icon.hasNotification && <View style={styles.notificationDot} />}
              <Ionicons
                name={icon.name}
                size={24}
                color={icon.color || colors.text} // 👈 fallback to theme text
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 15,
  } as ViewStyle,
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 2,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: "contain",
    marginLeft: 16,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 16,
  },
  iconWrapper: {
    position: "relative",
    paddingHorizontal: 4,
  },
  notificationDot: {
    position: "absolute",
    top: -4,
    right: 0,
    width: 10,
    height: 10,
    backgroundColor: "red",
    borderRadius: 5,
  },
});
