import { Drawer } from "expo-router/drawer";
import CustomDrawer from "./CustomDrawer";

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: "Home" }} />
      <Drawer.Screen name="aboutus" options={{ drawerLabel: "About Us" }} />
      <Drawer.Screen name="give" options={{ drawerLabel: "Give" }} />
      <Drawer.Screen
        name="locator"
        options={{ drawerLabel: "Church Locator" }}
      />
      <Drawer.Screen name="share" options={{ drawerLabel: "Share App" }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: "Settings" }} />
    </Drawer>
  );
}
