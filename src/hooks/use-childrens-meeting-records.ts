import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildrensMeetingRecord } from "@/types/extended";

const KEY = "childrens-meeting-records";
const API = "/api/v1/childrens-meeting-records";

export function useChildrensMeetingRecords() {
  return useQuery<{ data: ChildrensMeetingRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateChildrensMeetingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildrensMeetingRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateChildrensMeetingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildrensMeetingRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
