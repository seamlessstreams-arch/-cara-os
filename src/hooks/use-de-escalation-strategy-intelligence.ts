import { useQuery } from "@tanstack/react-query";

export type BehaviourSignal = "strengths" | "progressing" | "developing" | "needs_support";

export interface TimeSlot {
  slot: string;
  concerningCount: number;
  positiveCount: number;
}

export interface StrategyResult {
  strategy: string;
  usageCount: number;
  resolvedCount: number;
  escalatedCount: number;
  resolutionRate: number;
}

export interface StaffEngagementProfile {
  staffId: string;
  staffName: string;
  totalEntries: number;
  positiveEntries: number;
  positiveRate: number;
}

export interface ChildBehaviourProfile {
  childId: string;
  childName: string;
  totalEntries: number;
  positiveCount: number;
  concerningCount: number;
  positiveRatio: number | null; // 0–100; null when nothing has been recorded for this child
  last30dConcerning: number;
  prior30dConcerning: number;
  concernTrend: "improving" | "stable" | "worsening";
  severeEntries: number;
  topStrategies: StrategyResult[];
  timeRisk: TimeSlot[];
  signal: BehaviourSignal;
  supervisionPrompt: string;
}

export interface DeEscalationSummary {
  totalEntries: number;
  totalPositive: number;
  totalConcerning: number;
  homePositiveRatio: number | null;
  homeConcernTrend: "improving" | "stable" | "worsening";
  mostEffectiveStrategies: StrategyResult[];
  highRiskTimeSlots: TimeSlot[];
  staffEngagementProfiles: StaffEngagementProfile[];
  ofstedNote: string;
}

export interface DeEscalationStrategyResponse {
  data: {
    childProfiles: ChildBehaviourProfile[];
    summary: DeEscalationSummary;
  };
}

export function useDeEscalationStrategyIntelligence() {
  return useQuery<DeEscalationStrategyResponse>({
    queryKey: ["de-escalation-strategy-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/de-escalation-strategy-intelligence");
      if (!res.ok) throw new Error("Failed to fetch de-escalation strategy intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });
}
