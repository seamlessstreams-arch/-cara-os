"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HOOKS
//
// React Query hooks for home data, mirroring the pattern in use-staff.ts.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import { useHomeContext } from "@/contexts/home-context";
import type { CornerstoneHome } from "@/lib/homes/home-registry";

interface HomeSummary extends CornerstoneHome {
  compliance_score: number;
  open_incidents: number;
  overdue_tasks: number;
  staff_count: number;
}

interface HomesResponse {
  data: HomeSummary[];
  meta: {
    total_homes: number;
    total_children: number;
    total_staff: number;
    average_compliance: number;
  };
}

/** Fetch all active homes with summary stats from the API. */
export function useHomes() {
  return useQuery({
    queryKey: ["homes"],
    queryFn: () => api.get<HomesResponse>("/homes"),
  });
}

/** Convenience hook — returns the current home from context. */
export function useCurrentHome() {
  const { currentHome, setCurrentHome, availableHomes } = useHomeContext();
  return { currentHome, setCurrentHome, availableHomes };
}
