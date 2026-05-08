import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildInjuryRecord } from "@/types/extended";

const KEY = "child-injury-records";
const API = "/api/v1/child-injury-records";

export function useChildInjuryRecords(childId?: string) {
  return useQuery<{ data: ChildInjuryRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateChildInjuryRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildInjuryRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateChildInjuryRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildInjuryRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
