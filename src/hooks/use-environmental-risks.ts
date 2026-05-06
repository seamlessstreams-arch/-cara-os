import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EnvironmentalRisk } from "@/types/extended";

const KEY = "environmental-risks";
const API = "/api/v1/environmental-risks";

export function useEnvironmentalRisks() {
  return useQuery<{ data: EnvironmentalRisk[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateEnvironmentalRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EnvironmentalRisk>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateEnvironmentalRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EnvironmentalRisk> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
