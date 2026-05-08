import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LgbtqInclusionRecord } from "@/types/extended";

const KEY = "lgbtq-inclusion-records";

export function useLgbtqInclusionRecords(childId?: string) {
  return useQuery<{ data: LgbtqInclusionRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () =>
      fetch(
        childId
          ? `/api/v1/lgbtq-inclusion-records?child_id=${childId}`
          : "/api/v1/lgbtq-inclusion-records"
      ).then((r) => r.json()),
  });
}

export function useCreateLgbtqInclusionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LgbtqInclusionRecord>) =>
      fetch("/api/v1/lgbtq-inclusion-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLgbtqInclusionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LgbtqInclusionRecord> & { id: string }) =>
      fetch("/api/v1/lgbtq-inclusion-records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
