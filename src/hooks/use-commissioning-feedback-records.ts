import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommissioningFeedbackRecord } from "@/types/extended";

const KEY = "commissioning-feedback-records";
const API = "/api/v1/commissioning-feedback-records";

export function useCommissioningFeedbackRecords(childId?: string) {
  return useQuery<{ data: CommissioningFeedbackRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateCommissioningFeedbackRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CommissioningFeedbackRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCommissioningFeedbackRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CommissioningFeedbackRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
