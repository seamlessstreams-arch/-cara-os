import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ContextualSafeguardingRisk } from "@/types/extended";

const KEY = "contextual-safeguarding-risks";
const API = "/api/v1/contextual-safeguarding-risks";

export function useContextualSafeguardingRisks() {
  return useQuery<{ data: ContextualSafeguardingRisk[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateContextualSafeguardingRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContextualSafeguardingRisk>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateContextualSafeguardingRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContextualSafeguardingRisk> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
