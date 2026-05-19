import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { RiGovernanceReport } from "@/types/extended";

const KEY = "ri-governance-reports";

export function useRiGovernanceReports(homeId?: string) {
  const qs = homeId ? `?home_id=${homeId}` : "";
  return useQuery({
    queryKey: [KEY, homeId],
    queryFn: () => api.get<{ data: RiGovernanceReport[] }>(`/api/v1/ri-governance-reports${qs}`),
    staleTime: 30_000,
  });
}

export function useCreateRiGovernanceReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RiGovernanceReport>) =>
      api.post<{ data: RiGovernanceReport }>("/api/v1/ri-governance-reports", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateRiGovernanceReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RiGovernanceReport> & { id: string }) =>
      api.post<{ data: RiGovernanceReport }>("/api/v1/ri-governance-reports", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
