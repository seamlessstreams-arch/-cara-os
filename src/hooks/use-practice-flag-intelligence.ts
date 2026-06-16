import { useQuery } from "@tanstack/react-query";

export type FlagSeverity = "high" | "medium" | "low";
export type OverallSignal = "urgent" | "attention" | "good";

export interface PracticeFlagEntry {
  id: string;
  childId: string | null;
  staffId: string | null;
  childName: string | null;
  flagType: string;
  title: string;
  description: string;
  evidence: string;
  recommendedAction: string;
  severity: FlagSeverity;
  requiresManagerReview: boolean;
  requiresRiReview: boolean;
  sourceType: string;
  sourceId: string | null;
  createdAt: string;
}

export interface ThresholdConsultationEntry {
  id: string;
  childId: string | null;
  childName: string | null;
  concernType: string;
  summary: string;
  recommendedNextStep: string;
  strategyDiscussionRecommended: boolean;
  ladoConsultationRecommended: boolean;
  emergencyActionRecommended: boolean;
  managerDecision: string | null;
  createdAt: string;
}

export interface StaffWellbeingSignalEntry {
  id: string;
  staffId: string;
  staffName: string;
  signalType: string;
  severity: FlagSeverity;
  evidence: string;
  supportRecommendation: string;
  managerAction: string | null;
  resolved: boolean;
}

export interface PracticeFlagSummary {
  totalFlags: number;
  unresolvedFlags: number;
  highSeverityCount: number;
  managerReviewRequiredCount: number;
  riReviewRequiredCount: number;
  thresholdConsultationCount: number;
  staffWellbeingSignalCount: number;
  overallSignal: OverallSignal;
  flagTypeBreakdown: { type: string; count: number }[];
  childrenWithFlags: { childId: string; childName: string; flagCount: number; highSeverityCount: number }[];
}

export interface PracticeFlagIntelligenceResponse {
  data: {
    priorityFlags: PracticeFlagEntry[];
    allFlags: PracticeFlagEntry[];
    thresholdConsultations: ThresholdConsultationEntry[];
    staffWellbeingSignals: StaffWellbeingSignalEntry[];
    summary: PracticeFlagSummary;
  };
}

export function usePracticeFlagIntelligence() {
  return useQuery<PracticeFlagIntelligenceResponse>({
    queryKey: ["practice-flag-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/practice-flag-intelligence");
      if (!res.ok) throw new Error("Failed to fetch practice flag intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });
}
