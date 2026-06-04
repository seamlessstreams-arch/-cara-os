import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AlertNotification } from "@/types/extended";

export function useAlertNotifications() {
  return useQuery<AlertNotification[]>({
    queryKey: ["alert-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/v1/alert-notifications");
      if (!res.ok) throw new Error("Failed to fetch alert notifications");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateAlertNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AlertNotification>) => {
      const res = await fetch("/api/v1/alert-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create alert notification");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-notifications"] }),
  });
}
