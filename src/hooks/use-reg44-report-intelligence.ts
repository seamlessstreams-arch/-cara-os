"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Reg 44 Report Intelligence hook (client)
// GET /api/v1/reg44-report-intelligence?home_id=…&month=YYYY-MM
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import type { Reg44QualityStandardsAssessment } from "@/lib/reg44-report-intelligence/types";
import type { Reg44ReportAssembly } from "@/lib/reg44-report-intelligence/report-assembly";

const KEY = "reg44-report-intelligence";
const URL = "/api/v1/reg44-report-intelligence";

export function useReg44ReportIntelligence(homeId = "home_oak", month?: string, spokenTo?: number) {
  const params = new URLSearchParams({ home_id: homeId });
  if (month) params.set("month", month);
  if (typeof spokenTo === "number") params.set("spoken_to", String(spokenTo));
  return useQuery<{ data: { assessment: Reg44QualityStandardsAssessment; assembly: Reg44ReportAssembly; pack: { id: string; window: { start: string; end: string }; headline: Record<string, number> } } }>({
    queryKey: [KEY, homeId, month ?? "", spokenTo ?? 0],
    queryFn: () => fetch(`${URL}?${params.toString()}`).then((r) => r.json()),
    staleTime: 2 * 60 * 1000,
  });
}
