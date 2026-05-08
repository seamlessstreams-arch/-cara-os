import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LocalityRisk } from "@/types/extended";

const KEY = "locality-risks";

export function useLocalityRisks() {
  return useQuery<{ data: LocalityRisk[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/locality-risks").then((r) => r.json()),
  });
}

export function useCreateLocalityRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LocalityRisk>) =>
      fetch("/api/v1/locality-risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLocalityRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LocalityRisk> & { id: string }) =>
      fetch("/api/v1/locality-risks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
