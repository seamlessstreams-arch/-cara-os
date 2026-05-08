import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DeafHearingSupportRecord } from "@/types/extended";

const KEY = "deaf-hearing-support-records";
const API = "/api/v1/deaf-hearing-support-records";

export function useDeafHearingSupportRecords(childId?: string) {
  return useQuery<{ data: DeafHearingSupportRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateDeafHearingSupportRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DeafHearingSupportRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDeafHearingSupportRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DeafHearingSupportRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
