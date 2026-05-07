import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationLogEntry } from "@/types/extended";

const KEY = "notification-log-entries";

async function fetchRecords(): Promise<{ data: NotificationLogEntry[] }> {
  const res = await fetch("/api/v1/notification-log-entries");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useNotificationLog() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRecords });
}

export function useCreateNotificationLogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationLogEntry>) => {
      const res = await fetch("/api/v1/notification-log-entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateNotificationLogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationLogEntry> & { id: string }) => {
      const res = await fetch("/api/v1/notification-log-entries", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
