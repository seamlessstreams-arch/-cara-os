"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export type FrameworkSignal = "active" | "emerging" | "dormant";
export type FrameworkTrend = "increasing" | "stable" | "declining";

export interface SourceBreakdown {
  writingAssistant: number;
  reflectiveSupervision: number;
  incidentMode: number;
  paceProfiles: number;
  practiceObservations: number;
}

export interface TopEngager {
  staffId: string;
  name: string;
  count: number;
}

export interface FrameworkUsage {
  frameworkId: string;
  title: string;
  shortDesc: string;
  icon: string;
  totalEngagements: number;
  sources: SourceBreakdown;
  signal: FrameworkSignal;
  trend: FrameworkTrend;
  topEngagers: TopEngager[];
  supervisionPrompt: string;
}

export interface FrameworkUsageSummary {
  totalEngagements: number;
  activeFrameworks: number;
  mostActiveFramework: { id: string; title: string } | null;
  needsAttentionFramework: { id: string; title: string } | null;
  topPractitioner: TopEngager | null;
  sourceBreakdown: SourceBreakdown;
}

export interface PracticeFrameworkUsageResponse {
  frameworks: FrameworkUsage[];
  summary: FrameworkUsageSummary;
}

export function usePracticeFrameworkUsage() {
  return useQuery({
    queryKey: ["practice-framework-usage"],
    queryFn: () =>
      api.get<{ data: PracticeFrameworkUsageResponse }>("/practice-framework-usage"),
    staleTime: 60_000,
  });
}
