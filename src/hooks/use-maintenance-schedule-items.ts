import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MaintenanceScheduleItem } from "@/types/extended";

const KEY = "maintenance-schedule-items";

export function useMaintenanceScheduleItems() {
  return useQuery<{ data: MaintenanceScheduleItem[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/maintenance-schedule-items").then((r) => r.json()),
  });
}

export function useCreateMaintenanceScheduleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MaintenanceScheduleItem>) =>
      fetch("/api/v1/maintenance-schedule-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMaintenanceScheduleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MaintenanceScheduleItem> & { id: string }) =>
      fetch("/api/v1/maintenance-schedule-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
