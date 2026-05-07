import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { KpiEntry } from "@/types/extended";

const KEY = "kpi-entries";

export function useKpiEntries() {
  return useQuery<{ data: KpiEntry[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/kpi-entries").then((r) => r.json()),
  });
}

export function useCreateKpiEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KpiEntry>) =>
      fetch("/api/v1/kpi-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateKpiEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KpiEntry> & { id: string }) =>
      fetch("/api/v1/kpi-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
