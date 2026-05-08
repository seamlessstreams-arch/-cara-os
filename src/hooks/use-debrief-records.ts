import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DebriefRecord } from "@/types/extended";

const KEY = "debrief-records";
const API = "/api/v1/debrief-records";

export function useDebriefRecords(childId?: string) {
  return useQuery<{ data: DebriefRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateDebriefRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DebriefRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDebriefRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DebriefRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
