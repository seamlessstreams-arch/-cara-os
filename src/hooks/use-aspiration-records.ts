import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AspirationRecord } from "@/types/extended";

const KEY = "aspiration-records";
const API = "/api/v1/aspiration-records";

export function useAspirationRecords(childId?: string) {
  return useQuery<{ data: AspirationRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateAspirationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AspirationRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAspirationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AspirationRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
