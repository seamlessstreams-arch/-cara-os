import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/types/extended";

export function useNotifications(params?: { recipientId?: string; unreadOnly?: boolean }) {
  const query = new URLSearchParams();
  if (params?.recipientId) query.set("recipient_id", params.recipientId);
  if (params?.unreadOnly) query.set("unread_only", "true");

  return useQuery<Notification[]>({
    queryKey: ["notifications", params],
    queryFn: async () => {
      const res = await fetch(`/api/v1/notifications?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30_000, // poll every 30 s for near-real-time
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true, read_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to mark notification read");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
