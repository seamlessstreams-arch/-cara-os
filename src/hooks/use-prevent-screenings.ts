import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PreventScreeningRecord } from "@/types/extended";

const KEY = "prevent-screenings";
const API = "/api/v1/prevent-screenings";

export function usePreventScreenings(childId?: string) {
  return useQuery<{ data: PreventScreeningRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePreventScreening() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PreventScreeningRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePreventScreening() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PreventScreeningRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
