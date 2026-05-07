import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CleaningEntry } from "@/types/extended";

const KEY = "cleaning-entries";

export function useCleaningEntries() {
  return useQuery<{ data: CleaningEntry[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/cleaning-entries").then((r) => r.json()),
  });
}

export function useCreateCleaningEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CleaningEntry>) =>
      fetch("/api/v1/cleaning-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
