"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { SignInStatus } from "@/lib/attendance/sign-in-service";

export type { SignInStatus } from "@/lib/attendance/sign-in-service";

export function useSignInStatus() {
  return useQuery({
    queryKey: ["sign-in", "status"],
    queryFn: async () => (await api.get<{ data: SignInStatus }>("/sign-in")).data,
    staleTime: 10_000,
  });
}

export interface ClockActionResult {
  status: SignInStatus;
  late_minutes?: number;
  duration_minutes?: number;
  overtime_minutes?: number;
  created_adhoc?: boolean;
  already_on_shift?: boolean;
}

export function useClockInOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { action: "clock_in" | "clock_out"; note?: string }) =>
      api.post<{ data: ClockActionResult }>("/sign-in", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sign-in"] });
      // Going on/off shift changes Comms channel visibility + shift dashboards.
      qc.invalidateQueries({ queryKey: ["comms", "channels"] });
      qc.invalidateQueries({ queryKey: ["shift-summary"] });
      qc.invalidateQueries({ queryKey: ["rota"] });
    },
  });
}
