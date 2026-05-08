import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SmokingVapingRecord } from "@/types/extended";

const KEY = "smoking-vaping-records";
const API = "/api/v1/smoking-vaping-records";

export function useSmokingVapingRecords(childId?: string) {
  return useQuery<{ data: SmokingVapingRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateSmokingVapingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SmokingVapingRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSmokingVapingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SmokingVapingRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
