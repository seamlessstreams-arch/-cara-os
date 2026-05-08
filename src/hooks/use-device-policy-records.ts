import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DevicePolicyRecord } from "@/types/extended";

const KEY = "device-policy-records";
const API = "/api/v1/device-policy-records";

export function useDevicePolicyRecords(childId?: string) {
  return useQuery<{ data: DevicePolicyRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateDevicePolicyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DevicePolicyRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDevicePolicyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DevicePolicyRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
