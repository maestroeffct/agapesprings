import { scheduleLocalNotification } from "@/store/notificationService";
import { socket } from "@/store/socket";
import { useEffect } from "react";

export function useSocketNotifications() {
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on(
      "new-notification",
      (data: { title: string; body: string; path?: string }) => {
        scheduleLocalNotification({
          title: data.title,
          body: data.body,
          data: { path: data.path },
        });
      }
    );

    return () => {
      socket.off("new-notification");
    };
  }, []);
}
