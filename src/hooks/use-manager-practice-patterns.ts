"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export interface PatternTypeBreakdown {
  patternType: string;
  count: number;
  affectedChildren: string[];
  highRiskCount: number;
}

export interface PatternInsightItem {
  patternType: string;
  childId: string;
  riskLevel: "low" | "medium" | "high";
  evidence: string[];
  recommendedManagerActions: string[];
  supervisionPrompts: string[];
  planReviewNeeded: boolean;
  dateRange: { from: string; to: string };
  staffIds?: string[];
}

export interface ChildPatternSummary {
  childId: string;
  childName: string;
  totalRecords: number;
  patternInsights: PatternInsightItem[];
  patternTypes: string[];
  highRiskCount: number;
  planReviewNeeded: boolean;
}

export interface ManagerPracticePatternsSummary {
  totalRecordsAnalysed: number;
  totalInsights: number;
  childrenWithPatterns: number;
  planReviewsNeeded: number;
  highRiskInsights: number;
  periodDays: number;
}

export interface ManagerPracticePatternsResponse {
  summary: ManagerPracticePatternsSummary;
  childSummaries: ChildPatternSummary[];
  patternBreakdown: PatternTypeBreakdown[];
  disclaimer: string;
}

export function useManagerPracticePatterns() {
  return useQuery({
    queryKey: ["manager-practice-patterns"],
    queryFn: () =>
      api.get<{ data: ManagerPracticePatternsResponse }>("/manager-practice-patterns"),
    staleTime: 60_000,
  });
}
