import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HateIncident } from "@/types/extended";

const KEY = "hate-incidents";
const API = "/api/v1/hate-incidents";

export function useHateIncidents() {
  return useQuery<{ data: HateIncident[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateHateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HateIncident>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateHateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HateIncident> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
