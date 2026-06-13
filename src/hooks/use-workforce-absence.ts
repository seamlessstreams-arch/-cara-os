"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { WorkforceAbsenceResult } from "@/lib/engines/workforce-absence-engine";

export function useWorkforceAbsence() {
  return useQuery({
    queryKey: ["workforce-absence"],
    queryFn: () => api.get<{ data: WorkforceAbsenceResult }>("/workforce-absence"),
    staleTime: 30_000,
  });
}
