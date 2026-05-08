import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TraumaTherapyLog } from "@/types/extended";

const KEY = "trauma-therapy-logs";
const API = "/api/v1/trauma-therapy-logs";

export function useTraumaTherapyLogs(childId?: string) {
  return useQuery<{ data: TraumaTherapyLog[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateTraumaTherapyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TraumaTherapyLog>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateTraumaTherapyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TraumaTherapyLog> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
