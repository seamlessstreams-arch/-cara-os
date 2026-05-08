import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreativeProjectRecord } from "@/types/extended";

const KEY = "creative-project-records";
const API = "/api/v1/creative-project-records";

export function useCreativeProjectRecords(childId?: string) {
  return useQuery<{ data: CreativeProjectRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateCreativeProjectRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreativeProjectRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCreativeProjectRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreativeProjectRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
