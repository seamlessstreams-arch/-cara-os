"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { Shift } from "@/types";
import type { ShiftLifecycle } from "@/lib/shift-lifecycle/shift-lifecycle-engine";

export interface ShiftLifecycleData {
  staffId: string;
  staffName: string;
  shift: Shift | null;
  lifecycle: ShiftLifecycle | null;
  writeEnabled: boolean;
  message?: string;
}

/** The caller's current (or most recent) shift, walked stage by stage. */
export function useShiftLifecycle(staffId?: string) {
  const qs = staffId ? `?staff_id=${encodeURIComponent(staffId)}` : "";
  return useQuery({
    queryKey: ["shift-lifecycle", staffId ?? "me"],
    queryFn: async () =>
      (await api.get<{ data: ShiftLifecycleData }>(`/shift-lifecycle${qs}`)).data,
  });
}

/** Tick a check only the person who was there can answer. */
export function useAttestCheck(staffId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { shift_id: string; check_id: string }) =>
      api.post<{ data: { lifecycle: ShiftLifecycle | null } }>("/shift-lifecycle", vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-lifecycle", staffId ?? "me"] });
    },
  });
}

/** Sign the shift off. A 422 here is not a refusal — it means Cara is asking
 *  for a reason, and the same call with `override_reason` will be accepted. */
export function useSignOffShift(staffId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { shift_id: string; override_reason?: string }) =>
      api.patch<{ data: { lifecycle: ShiftLifecycle | null } }>("/shift-lifecycle", vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-lifecycle", staffId ?? "me"] });
    },
  });
}
