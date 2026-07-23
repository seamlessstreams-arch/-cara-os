import { useQuery } from "@tanstack/react-query";

export type EffectivenessSignal = "exemplary" | "strong" | "developing" | "needs_support";

export interface KeyChildSnapshot {
  childId: string;
  childName: string;
  sessionsLast30d: number;
  daysSinceLastSession: number | null;
  notSeenIn30d: boolean;
}

export interface StaffKeyWorkerProfile {
  staffId: string;
  staffName: string;
  jobTitle: string;
  keyChildCount: number;
  keyChildren: KeyChildSnapshot[];
  totalSessionsLast30d: number;
  avgSessionsPerKeyChildLast30d: number;
  childVoiceScore: number | null;
  childVoicePresenceRate: number | null;
  moodImprovementRate: number | null;
  followUpCompletionRate: number | null;
  therapeuticApproachRate: number | null;
  keyChildrenNotSeen: number;
  effectivenessSignal: EffectivenessSignal;
  supervisionPrompt: string;
}

export interface KeyWorkerEffectivenessSummary {
  totalKeyWorkers: number;
  exemplary: number;
  strong: number;
  developing: number;
  needs_support: number;
  keyChildrenNotSeenIn30d: number;
  homeFollowUpCompletionRate: number | null;
  homeChildVoicePresenceRate: number | null;
  managerNote: string;
}

export interface KeyWorkerEffectivenessResponse {
  data: {
    staffProfiles: StaffKeyWorkerProfile[];
    summary: KeyWorkerEffectivenessSummary;
  };
}

export function useKeyWorkerEffectivenessIntelligence() {
  return useQuery<KeyWorkerEffectivenessResponse>({
    queryKey: ["key-worker-effectiveness-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/key-worker-effectiveness-intelligence");
      if (!res.ok) throw new Error("Failed to fetch key worker effectiveness intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });
}
