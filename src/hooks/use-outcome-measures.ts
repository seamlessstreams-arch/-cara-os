"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OutcomeMeasure } from "@/types/extended";

const KEY = "outcome-measures";

export function useOutcomeMeasures(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: OutcomeMeasure[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/outcome-measures${qs}`).then((r) => r.json()),
  });
}

export function useCreateOutcomeMeasure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<OutcomeMeasure>) =>
      fetch("/api/v1/outcome-measures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
