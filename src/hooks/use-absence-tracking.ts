import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AbsenceRecord } from "@/types/extended";

const KEY = "absence-tracking";
const API = "/api/v1/absence-tracking";

export function useAbsenceTracking(childId?: string) {
  return useQuery<{ data: AbsenceRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AbsenceRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AbsenceRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
