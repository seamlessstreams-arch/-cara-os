import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AsthmaPlan } from "@/types/extended";

const KEY = "asthma-plans";
const API = "/api/v1/asthma-plans";

export function useAsthmaPlans(childId?: string) {
  return useQuery<{ data: AsthmaPlan[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateAsthmaPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AsthmaPlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAsthmaPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AsthmaPlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
