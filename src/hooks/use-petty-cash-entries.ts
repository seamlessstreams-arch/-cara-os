import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PettyCashEntry } from "@/types/extended";

const KEY = "petty-cash-entries";
const API = "/api/v1/petty-cash-entries";

export function usePettyCashEntries() {
  return useQuery<{ data: PettyCashEntry[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreatePettyCashEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PettyCashEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePettyCashEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PettyCashEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
