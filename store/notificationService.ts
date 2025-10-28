import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", token); // 👈 Copy this
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

// Configure how notifications show when app is foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,

    // 👇 Add these for iOS 15+ support
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Listen for taps
export function listenToNotifications() {
  // App in foreground
  Notifications.addNotificationReceivedListener((notification) => {
    console.log("📩 Notification received in foreground:", notification);
  });

  // App opened/tapped from system tray
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("👉 Notification tapped:", response);
    const screen = response.notification.request.content.data?.screen;

    if (screen === "audio-player") {
      router.push("/audio-player");
    } else if (screen === "notifications") {
      router.push("/notifications");
    }
  });
}

export async function scheduleLocalNotification({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // null means immediate
  });
}
