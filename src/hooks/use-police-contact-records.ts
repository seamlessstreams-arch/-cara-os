import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PoliceContactRecord } from "@/types/extended";

const KEY = "police-contact-records";
const API = "/api/v1/police-contact-records";

export function usePoliceContactRecords(childId?: string) {
  return useQuery<{ data: PoliceContactRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePoliceContactRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PoliceContactRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePoliceContactRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PoliceContactRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
