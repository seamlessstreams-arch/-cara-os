import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IroCorrespondence } from "@/types/extended";

const KEY = "iro-correspondences";

export function useIroCorrespondences(childId?: string) {
  return useQuery<{ data: IroCorrespondence[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () =>
      fetch(childId ? `/api/v1/iro-correspondences?child_id=${childId}` : "/api/v1/iro-correspondences").then((r) => r.json()),
  });
}

export function useCreateIroCorrespondence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IroCorrespondence>) =>
      fetch("/api/v1/iro-correspondences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
