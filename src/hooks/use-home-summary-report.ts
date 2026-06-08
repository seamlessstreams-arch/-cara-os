"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeSummaryReportResult } from "@/lib/engines/home-summary-report-engine";

export function useHomeSummaryReport() {
  return useQuery<HomeSummaryReportResult>({
    queryKey: ["home-summary-report"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-summary-report");
      if (!res.ok) throw new Error("Failed to fetch home summary report");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 300_000,
  });
}
