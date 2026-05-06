import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EhcpRecord } from "@/types/extended";

const KEY = "ehcp-records";
const API = "/api/v1/ehcp-records";

export function useEhcpRecords(childId?: string) {
  return useQuery<{ data: EhcpRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateEhcpRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EhcpRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateEhcpRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EhcpRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
