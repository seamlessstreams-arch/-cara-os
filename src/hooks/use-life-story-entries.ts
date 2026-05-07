import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LifeStoryEntry } from "@/types/extended";

const KEY = "life-story-entries";

export function useLifeStoryEntries(childId?: string) {
  return useQuery<{ data: LifeStoryEntry[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () =>
      fetch(
        childId
          ? `/api/v1/life-story-entries?child_id=${childId}`
          : "/api/v1/life-story-entries"
      ).then((r) => r.json()),
  });
}

export function useCreateLifeStoryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LifeStoryEntry>) =>
      fetch("/api/v1/life-story-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLifeStoryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LifeStoryEntry> & { id: string }) =>
      fetch("/api/v1/life-story-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
