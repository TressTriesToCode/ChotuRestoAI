import { apiFetch } from "./client";

export interface NotificationData {
  id: string;
  restaurant_id: string;
  title: string;
  message: string;
  type: string;
  severity: "info" | "warning" | "alert" | "critical";
  is_read: boolean;
  metadata_json?: Record<string, any> | null;
  created_at: string;
}

export async function fetchNotifications(
  unreadOnly = false
): Promise<NotificationData[]> {
  return apiFetch<NotificationData[]>(`/notifications?unread_only=${unreadOnly}`);
}

export async function markNotificationRead(id: string): Promise<NotificationData> {
  return apiFetch<NotificationData>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>("/notifications/mark-all-read", {
    method: "POST",
  });
}
