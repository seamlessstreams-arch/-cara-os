"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { SafeStaffingStatus } from "@/lib/staffing/safe-staffing-service";
import type { EmergencyAlert, EmergencyType } from "@/lib/staffing/emergency-types";

export type { SafeStaffingStatus } from "@/lib/staffing/safe-staffing-service";
export type { EmergencyAlert, EmergencyType } from "@/lib/staffing/emergency-types";

export function useSafeStaffing() {
  return useQuery({
    queryKey: ["safe-staffing"],
    queryFn: async () => (await api.get<{ data: SafeStaffingStatus }>("/safe-staffing")).data,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useEmergencyAlerts() {
  return useQuery({
    queryKey: ["emergency", "active"],
    queryFn: async () => (await api.get<{ data: EmergencyAlert[] }>("/emergency")).data ?? [],
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export function useTriggerEmergency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { type: EmergencyType; location?: string; note?: string }) =>
      api.post<{ data: { alert: EmergencyAlert } }>("/emergency", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency"] });
      qc.invalidateQueries({ queryKey: ["comms", "messages"] });
      qc.invalidateQueries({ queryKey: ["comms", "channels"] });
    },
  });
}

export function useEmergencyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "acknowledge" | "resolve" }) =>
      api.patch(`/emergency/${id}`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency"] }),
  });
}
