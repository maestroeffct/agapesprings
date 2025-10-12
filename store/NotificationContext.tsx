import { getNotifications, NotificationItem } from "@/api/notifications";
import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

type NotificationContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
});

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial notifications
    (async () => {
      try {
        const rows = await getNotifications();
        setNotifications(rows || []);
        setUnreadCount(rows.length); // all unread initially
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    })();

    // Connect to backend socket
    const socket = io(process.env.EXPO_PUBLIC_API_GATEWAY!, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🔌 Connected to notifications socket:", socket.id);
    });

    socket.on("recentActivity", (payload: any) => {
      if (payload?.category === "notifications") {
        console.log("📩 New notification event:", payload);

        const newNotification: NotificationItem = {
          id: Date.now(), // temp until API fetch
          title: payload.payload?.title,
          message: payload.payload?.message,
          imageUrl: payload.payload?.imageUrl,
          createdAt: new Date().toLocaleString(),
        };

        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAllRead = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
