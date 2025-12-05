// app/(drawer)/CustomDrawer.tsx
import { useThemeModal } from "@/components/ThemeModalHost";
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { router, useNavigation } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const navigation = useNavigation();
  const { colors, themeName } = useTheme();
  const { open } = useThemeModal();

  const topItems = [
    {
      label: "About Us",
      route: "/aboutus",
      icon: "information-circle-outline",
    },
    { label: "Give", route: "give", icon: "gift-outline" },
    { label: "Church Locator", route: "locator", icon: "location-outline" },
    { label: "Platforms", route: "platform", icon: "albums-outline" },
  ];

  const bottomItems = [
    { label: "App Theme", route: "theme", icon: "color-palette-outline" },
    { label: "Share App", route: "share", icon: "share-social-outline" },
  ];

  const onPressItem = (
    item: (typeof bottomItems)[number] | (typeof topItems)[number]
  ) => {
    if (item.route === "theme") {
      props.navigation.closeDrawer();
      setTimeout(() => open(), 120);
      return;
    }

    props.navigation.closeDrawer();
    setTimeout(() => {
      router.push(item.route as any);
    }, 120);
  };

  const logoSource =
    themeName === "dark"
      ? require("@/assets/images/logo_white.png") // dark mode
      : require("@/assets/images/logo_name.png"); // light mode

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, paddingTop: 50 }}
    >
      {/* Logo */}
      <View
        style={[styles.logoContainer, { borderBottomColor: colors.subtitle }]}
      >
        <Image source={logoSource} style={styles.logo} />
      </View>

      {/* Top Menu Items */}
      <View style={styles.menuContainer}>
        {topItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => onPressItem(item)}
            activeOpacity={0.75}
          >
            <View style={styles.menuLeft}>
              <Ionicons
                name={item.icon as any}
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.menuText, { color: colors.text }]}>
                {item.label}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.subtitle}
            />
          </TouchableOpacity>
        ))}

        {/* Divider */}
        <View style={styles.dividerWrapper}>
          <View
            style={[styles.divider, { backgroundColor: colors.subtitle }]}
          />
        </View>

        {/* Bottom Menu Items */}
        {bottomItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => onPressItem(item)}
            activeOpacity={0.75}
          >
            <View style={styles.menuLeft}>
              <Ionicons
                name={item.icon as any}
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.menuText, { color: colors.text }]}>
                {item.label}
                {item.route === "theme" ? (
                  <Text
                    style={{ color: colors.primary }}
                  >{`  ·  ${themeName}`}</Text>
                ) : null}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.subtitle}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.subtitle }]}>
        <Text style={[styles.version, { color: colors.subtitle }]}>
          Version 1.2.0
        </Text>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  logo: {
    width: 500,
    height: 66,
    resizeMode: "contain",
    marginBottom: 30,
  },
  menuContainer: { paddingHorizontal: 20 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  menuText: { fontSize: 14, fontWeight: "600", marginLeft: 10 },
  dividerWrapper: { marginVertical: 10, marginHorizontal: -20 },
  divider: { height: 1, width: "100%" },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    alignItems: "center",
    marginTop: 20,
  },
  version: { fontSize: 12 },
});
