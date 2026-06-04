import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { InspectionRecord } from "@/types/extended";

export function useInspectionHistory() {
  return useQuery({
    queryKey: ["inspection-history"],
    queryFn: () =>
      api.get<{ data: InspectionRecord[]; meta: { total: number } }>("/inspection-history"),
    staleTime: 60_000,
  });
}

export function useLatestInspection() {
  return useQuery({
    queryKey: ["inspection-history", "latest"],
    queryFn: () =>
      api.get<{ data: InspectionRecord | null }>("/inspection-history?latest=true"),
    staleTime: 60_000,
  });
}

export function useCreateInspectionRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InspectionRecord>) =>
      api.post<{ data: InspectionRecord }>("/inspection-history", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-history"] });
    },
  });
}

export function useUpdateInspectionRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<InspectionRecord>) =>
      api.patch<{ data: InspectionRecord }>(`/inspection-history/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-history"] });
    },
  });
}
