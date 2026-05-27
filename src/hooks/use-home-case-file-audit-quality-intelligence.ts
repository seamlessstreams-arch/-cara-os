"use client";

import { useQuery } from "@tanstack/react-query";
import type { CaseFileAuditResult } from "@/lib/engines/home-case-file-audit-quality-intelligence-engine";

interface CaseFileAuditResponse { data: CaseFileAuditResult; }

export function useHomeCaseFileAuditQualityIntelligence() {
  return useQuery<CaseFileAuditResponse>({
    queryKey: ["home-case-file-audit-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-case-file-audit-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch case file audit quality intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
