import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DutyLogEntry } from "@/types/extended";

const KEY = "duty-log-entries";
const API = "/api/v1/duty-log-entries";

export function useDutyLogEntries() {
  return useQuery<{ data: DutyLogEntry[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateDutyLogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DutyLogEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDutyLogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DutyLogEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
