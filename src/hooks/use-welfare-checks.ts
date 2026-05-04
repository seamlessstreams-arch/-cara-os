// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WELFARE CHECKS HOOK
// React Query hook for welfare check rounds and individual checks.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { WelfareCheck, WelfareCheckRound } from "@/types/extended";

interface WelfareChecksResponse {
  data: WelfareCheckRound[];
  checks: WelfareCheck[];
  meta: {
    total_rounds: number;
    today_rounds: number;
    total_checks: number;
    concerns_flagged: number;
    consecutive_days: number;
  };
}

export function useWelfareChecks(params?: { date?: string; child_id?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.date) searchParams.set("date", params.date);
  if (params?.child_id) searchParams.set("child_id", params.child_id);
  const qs = searchParams.toString();

  return useQuery<WelfareChecksResponse>({
    queryKey: ["welfare-checks", params],
    queryFn: () => api.get<WelfareChecksResponse>(`/welfare-checks${qs ? `?${qs}` : ""}`).then((r) => r),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useCreateWelfareCheckRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      staff_id: string;
      round_date: string;
      round_time: string;
      shift_type?: string;
      children_checks: Array<{
        child_id: string;
        status: string;
        location?: string;
        mood?: string;
        notes?: string;
        concern_details?: string;
        physical_marks_noted?: boolean;
        marks_description?: string;
      }>;
      building_secure?: boolean;
      fire_exits_clear?: boolean;
      external_doors_locked?: boolean;
      alarm_set?: boolean;
      additional_notes?: string;
    }) => api.post<{ data: WelfareCheckRound }>("/welfare-checks", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["welfare-checks"] });
    },
  });
}
