import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NightLogEntry } from "@/types/extended";

const KEY = "night-logs";
const API = "/api/v1/night-logs";

export function useNightLogs() {
  return useQuery<{ data: NightLogEntry[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateNightLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NightLogEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateNightLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NightLogEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
