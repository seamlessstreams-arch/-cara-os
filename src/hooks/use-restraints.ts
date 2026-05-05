import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RestraintRecord } from "@/types/extended";

const KEY = "restraints";
const API = "/api/v1/restraints";

export function useRestraints(childId?: string) {
  return useQuery<{ data: RestraintRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateRestraint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RestraintRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateRestraint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RestraintRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
