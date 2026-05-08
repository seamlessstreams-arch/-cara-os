import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HandoverAudit } from "@/types/extended";

const KEY = "handover-audits";
const API = "/api/v1/handover-audits";

export function useHandoverAudits() {
  return useQuery<{ data: HandoverAudit[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateHandoverAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HandoverAudit>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateHandoverAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HandoverAudit> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
