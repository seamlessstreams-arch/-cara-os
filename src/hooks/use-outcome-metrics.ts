import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OutcomeMetric } from "@/types/extended";

const KEY = "outcome-metrics";

async function fetchRecords(): Promise<{ data: OutcomeMetric[] }> {
  const res = await fetch("/api/v1/outcome-metrics");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOutcomeMetrics() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRecords });
}

export function useCreateOutcomeMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OutcomeMetric>) => {
      const res = await fetch("/api/v1/outcome-metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOutcomeMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OutcomeMetric> & { id: string }) => {
      const res = await fetch("/api/v1/outcome-metrics", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
