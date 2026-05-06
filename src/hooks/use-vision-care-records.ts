import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { VisionCareRecord } from "@/types/extended";

const KEY = "vision-care-records";
const API = "/api/v1/vision-care-records";

export function useVisionCareRecords(childId?: string) {
  return useQuery<{ data: VisionCareRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateVisionCareRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VisionCareRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateVisionCareRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VisionCareRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
