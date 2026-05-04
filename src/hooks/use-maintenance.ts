"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { MaintenanceItem } from "@/types/extended";

export interface MaintenanceResponse {
  data: MaintenanceItem[];
  meta: { total: number; open: number; scheduled: number; completed: number; urgent: number };
}

export function useMaintenance(params?: { status?: string; priority?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.priority) query.set("priority", params.priority);
  return useQuery({
    queryKey: ["maintenance", params],
    queryFn: () => api.get<MaintenanceResponse>(`/maintenance?${query}`),
  });
}

export function useCreateMaintenanceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MaintenanceItem>) =>
      api.post<{ data: MaintenanceItem }>("/maintenance", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }),
  });
}

export function useUpdateMaintenanceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaintenanceItem> }) =>
      api.patch<{ data: MaintenanceItem }>(`/maintenance/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }),
  });
}
