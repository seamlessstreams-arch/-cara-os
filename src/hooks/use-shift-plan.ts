"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ShiftPlanResult } from "@/lib/engines/shift-plan-engine";

export function useShiftPlan(date?: string, period?: "day" | "night") {
  const qs = new URLSearchParams();
  if (date) qs.set("date", date);
  if (period) qs.set("period", period);
  const q = qs.toString();
  return useQuery({
    queryKey: ["shift-plan", date, period],
    queryFn: () => api.get<{ data: ShiftPlanResult }>(`/shift-plan${q ? `?${q}` : ""}`),
    staleTime: 30_000,
  });
}
