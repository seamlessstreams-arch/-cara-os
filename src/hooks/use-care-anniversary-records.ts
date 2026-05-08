import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CareAnniversaryRecord } from "@/types/extended";

const KEY = "care-anniversary-records";
const API = "/api/v1/care-anniversary-records";

export function useCareAnniversaryRecords(childId?: string) {
  return useQuery<{ data: CareAnniversaryRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateCareAnniversaryRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CareAnniversaryRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCareAnniversaryRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CareAnniversaryRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
