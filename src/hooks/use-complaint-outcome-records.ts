import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ComplaintOutcomeRecord } from "@/types/extended";

const KEY = "complaint-outcome-records";
const API = "/api/v1/complaint-outcome-records";

export function useComplaintOutcomeRecords(childId?: string) {
  return useQuery<{ data: ComplaintOutcomeRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateComplaintOutcomeRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ComplaintOutcomeRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateComplaintOutcomeRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ComplaintOutcomeRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
