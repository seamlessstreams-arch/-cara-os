import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LaundrySelfCareRecord } from "@/types/extended";

const KEY = "laundry-self-care-records";
const API = "/api/v1/laundry-self-care-records";

export function useLaundrySelfCareRecords(childId?: string) {
  return useQuery<{ data: LaundrySelfCareRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateLaundrySelfCareRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LaundrySelfCareRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLaundrySelfCareRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LaundrySelfCareRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
