import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IndependencePathway } from "@/types/extended";

const KEY = "independence-pathways";

export function useIndependencePathways(childId?: string) {
  return useQuery<{ data: IndependencePathway[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () =>
      fetch(childId ? `/api/v1/independence-pathways?child_id=${childId}` : "/api/v1/independence-pathways").then((r) => r.json()),
  });
}

export function useCreateIndependencePathway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IndependencePathway>) =>
      fetch("/api/v1/independence-pathways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
