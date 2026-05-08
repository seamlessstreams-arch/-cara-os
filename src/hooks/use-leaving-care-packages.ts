import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LeavingCarePackage } from "@/types/extended";

const KEY = "leaving-care-packages";

export function useLeavingCarePackages(childId?: string) {
  return useQuery<{ data: LeavingCarePackage[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () =>
      fetch(
        childId
          ? `/api/v1/leaving-care-packages?child_id=${childId}`
          : "/api/v1/leaving-care-packages"
      ).then((r) => r.json()),
  });
}

export function useCreateLeavingCarePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeavingCarePackage>) =>
      fetch("/api/v1/leaving-care-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLeavingCarePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeavingCarePackage> & { id: string }) =>
      fetch("/api/v1/leaving-care-packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
