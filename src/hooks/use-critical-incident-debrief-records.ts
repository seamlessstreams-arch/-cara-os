import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CriticalIncidentDebriefRecord } from "@/types/extended";

const KEY = "critical-incident-debrief-records";
const API = "/api/v1/critical-incident-debrief-records";

export function useCriticalIncidentDebriefRecords() {
  return useQuery<{ data: CriticalIncidentDebriefRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateCriticalIncidentDebriefRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CriticalIncidentDebriefRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCriticalIncidentDebriefRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CriticalIncidentDebriefRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
