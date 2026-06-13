"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ManagerPlanDayResult } from "@/lib/engines/manager-plan-my-day-engine";

export function usePlanMyDay() {
  return useQuery({
    queryKey: ["plan-my-day"],
    queryFn: () => api.get<{ data: ManagerPlanDayResult }>("/manager-plan-my-day"),
    staleTime: 30_000,
  });
}

/**
 * Re-plan the day folding in ad-hoc items the manager pasted or dictated.
 * Returns the same shape as the GET — the page shows this result once it exists.
 */
export function usePlanMyDayWithNotes() {
  return useMutation({
    mutationFn: (notes: string) =>
      api.post<{ data: ManagerPlanDayResult }>("/manager-plan-my-day", { notes }),
  });
}
