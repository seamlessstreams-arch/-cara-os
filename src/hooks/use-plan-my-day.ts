"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ManagerPlanDayResult } from "@/lib/engines/manager-plan-my-day-engine";

export function usePlanMyDay() {
  return useQuery({
    queryKey: ["plan-my-day"],
    queryFn: () => api.get<{ data: ManagerPlanDayResult }>("/manager-plan-my-day"),
    staleTime: 30_000,
  });
}
