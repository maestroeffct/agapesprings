import apiClient from "./client";

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  targetUrl?: string;
  imageUrl?: string;
  scheduleAt?: string;
  createdAt: string;
};

// ✅ Paginated fetch
export async function getNotifications(page = 1, size = 20) {
  const res = await apiClient.get(`notifications/files/${page}/${size}`);
  return res.data?.data || [];
}
