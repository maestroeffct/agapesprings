import { getNotifications, NotificationItem } from "@/api/notifications";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform, Text, TouchableOpacity, Vibration } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import io from "socket.io-client";

type NotificationContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  reload: () => Promise<void>; // ✅ added reload support
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  reload: async () => {},
});

const NotificationBanner = ({
  title,
  message,
  onPress,
}: {
  title: string;
  message: string;
  onPress?: () => void;
}) => (
  <Animated.View
    entering={FadeInDown.springify().damping(20)}
    exiting={FadeOutUp.duration(200)}
    style={{
      position: "absolute",
      top: 50,
      left: 20,
      right: 20,
      backgroundColor: "rgba(0,0,0,0.85)",
      borderRadius: 12,
      padding: 14,
      zIndex: 999,
    }}
  >
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Text
        style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={{ color: "#ddd", fontSize: 13, marginTop: 2 }}
        numberOfLines={2}
      >
        {message}
      </Text>
    </TouchableOpacity>
  </Animated.View>
);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [banner, setBanner] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  // ✅ Reload function (used by pull-to-refresh)
  const reload = async () => {
    if (isReloading) return;
    try {
      setIsReloading(true);
      const rows = await getNotifications();
      setNotifications(rows || []);
      setUnreadCount(rows?.length || 0);
    } catch (err) {
      console.error("Failed to refresh notifications", err);
    } finally {
      setIsReloading(false);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const rows = await getNotifications();
        setNotifications(rows || []);
        setUnreadCount(rows.length);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    loadInitial();

    const socket = io(process.env.EXPO_PUBLIC_API_GATEWAY!, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🔌 Connected to notifications socket:", socket.id);
    });

    socket.on("recentActivities", (payload: any) => {
      if (payload?.category === "notifications") {
        console.log("📩 New notification event:", payload);

        const newNotification: NotificationItem = {
          id: Date.now(),
          title: payload.payload?.title,
          message: payload.payload?.message,
          imageUrl: payload.payload?.imageUrl,
          createdAt: new Date().toISOString(),
        };

        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // ✅ Feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (Platform.OS === "android") Vibration.vibrate(200);

        // ✅ Show in-app banner
        setBanner({
          title: payload.payload?.title ?? "New Notification",
          message: payload.payload?.message ?? "",
        });
        setTimeout(() => setBanner(null), 5000);

        // ✅ System push
        Notifications.scheduleNotificationAsync({
          content: {
            title: payload.payload?.title ?? "New Notification",
            body: payload.payload?.message ?? "",
            sound: "default",
            data: { screen: "notifications" },
          },
          trigger: null,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAllRead = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead, reload }}
    >
      {children}
      {banner && (
        <NotificationBanner
          title={banner.title}
          message={banner.message}
          onPress={() => setBanner(null)}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
