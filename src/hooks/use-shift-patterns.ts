"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ShiftPattern } from "@/lib/rota/shift-patterns";

export interface ShiftPatternRow extends ShiftPattern {
  staff_name: string;
  description: string;
}
export interface PatternsData {
  patterns: ShiftPatternRow[];
  staff: { id: string; name: string; role: string | null }[];
}

export interface PatternInput {
  id?: string;
  staff_id: string;
  name?: string;
  kind: "weekly" | "rotating";
  weekdays?: number[];
  cycle_on?: number;
  cycle_off?: number;
  anchor_date?: string | null;
  shift_type: string;
  start_time: string;
  end_time: string;
  active: boolean;
}

export function useShiftPatterns() {
  return useQuery({
    queryKey: ["shift-patterns"],
    queryFn: () => api.get<{ data: PatternsData }>("/rota/patterns"),
    staleTime: 30_000,
  });
}

function useInvalidatePatterns() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["shift-patterns"] });
    qc.invalidateQueries({ queryKey: ["staffing-cover"] }); // patterns drive the cover view
  };
}

export function useCreatePattern() {
  const invalidate = useInvalidatePatterns();
  return useMutation({
    mutationFn: (input: PatternInput) => api.post<{ data: ShiftPatternRow }>("/rota/patterns", input),
    onSuccess: invalidate,
  });
}

export function useUpdatePattern() {
  const invalidate = useInvalidatePatterns();
  return useMutation({
    mutationFn: (input: PatternInput & { id: string }) => api.patch<{ data: ShiftPatternRow }>("/rota/patterns", input),
    onSuccess: invalidate,
  });
}

export function useDeletePattern() {
  const invalidate = useInvalidatePatterns();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ data: { id: string; deleted: boolean } }>(`/rota/patterns?id=${encodeURIComponent(id)}`),
    onSuccess: invalidate,
  });
}
