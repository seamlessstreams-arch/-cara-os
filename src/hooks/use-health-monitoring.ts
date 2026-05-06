import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HealthMonitoringEntry } from "@/types/extended";

const KEY = "health-monitoring";
const API = "/api/v1/health-monitoring";

export function useHealthMonitoring(childId?: string) {
  return useQuery<{ data: HealthMonitoringEntry[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateHealthMonitoring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HealthMonitoringEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateHealthMonitoring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HealthMonitoringEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
