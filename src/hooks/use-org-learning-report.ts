"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Organisational Learning Report hook (client)
// GET /api/v1/org-learning-report?period=quarter|month
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import type { OrgLearningReport, ReportPeriod } from "@/lib/org-learning-report/types";

const KEY = "org-learning-report";
const URL = "/api/v1/org-learning-report";

export function useOrgLearningReport(period: ReportPeriod = "quarter") {
  return useQuery<{ data: OrgLearningReport }>({
    queryKey: [KEY, period],
    queryFn: () => fetch(`${URL}?period=${period}`).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });
}
