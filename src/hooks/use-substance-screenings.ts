import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SubstanceScreening } from "@/types/extended";

const KEY = "substance-screenings";
const API = "/api/v1/substance-screenings";

export function useSubstanceScreenings(childId?: string) {
  return useQuery<{ data: SubstanceScreening[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateSubstanceScreening() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SubstanceScreening>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSubstanceScreening() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SubstanceScreening> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
