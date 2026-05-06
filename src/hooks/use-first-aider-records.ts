import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FirstAiderRecord } from "@/types/extended";

const KEY = "first-aider-records";
const API = "/api/v1/first-aider-records";

export function useFirstAiderRecords() {
  return useQuery<{ data: FirstAiderRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateFirstAiderRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FirstAiderRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateFirstAiderRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FirstAiderRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
