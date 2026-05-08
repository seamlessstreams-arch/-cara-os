import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TutoringRecord } from "@/types/extended";

const KEY = "tutoring-records";
const API = "/api/v1/tutoring-records";

export function useTutoringRecords(childId?: string) {
  return useQuery<{ data: TutoringRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateTutoringRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TutoringRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateTutoringRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TutoringRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
