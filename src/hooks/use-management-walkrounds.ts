import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementWalkround } from "@/types/extended";

const KEY = "management-walkrounds";

export function useManagementWalkrounds() {
  return useQuery<{ data: ManagementWalkround[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/management-walkrounds").then((r) => r.json()),
  });
}

export function useCreateManagementWalkround() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ManagementWalkround>) =>
      fetch("/api/v1/management-walkrounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateManagementWalkround() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ManagementWalkround> & { id: string }) =>
      fetch("/api/v1/management-walkrounds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
