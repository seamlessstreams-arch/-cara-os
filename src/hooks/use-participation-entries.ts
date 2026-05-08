import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ParticipationEntry } from "@/types/extended";

const KEY = "participation-entries";

export function useParticipationEntries() {
  return useQuery<{ data: ParticipationEntry[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/participation-entries").then((r) => r.json()),
  });
}

export function useCreateParticipationEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ParticipationEntry>) =>
      fetch("/api/v1/participation-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
