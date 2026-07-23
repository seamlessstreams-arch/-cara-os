import { useQuery } from "@tanstack/react-query";

export type CycleStatus = "complete" | "partial" | "missing";

export interface RepairStep {
  id: string;
  label: string;
  complete: boolean;
  note: string;
}

export interface IncidentRepairProfile {
  incidentId: string;
  incidentDate: string;
  incidentType: string;
  incidentSeverity: string;
  childId: string;
  reportedBy: string;
  hasDebrief: boolean;
  debriefId: string | null;
  debriefDate: string | null;
  debriefTurnaroundDays: number | null;
  childPerspectiveCaptured: boolean;
  lessonsLearnedDocumented: boolean;
  changesNeedDocumented: boolean;
  staffSupportOffered: boolean;
  steps: RepairStep[];
  stepsComplete: number;
  totalSteps: number;
  cycleStatus: CycleStatus;
  supervisionPrompt: string;
}

export interface ChildRepairSummary {
  childId: string;
  childName: string;
  totalIncidents: number;
  incidentsWithCompleteRepair: number;
  incidentsWithPartialRepair: number;
  incidentsWithNoRepair: number;
  cycleCompletionRate: number | null;
  mostCommonMissingStep: string | null;
  supervisionPrompt: string;
}

export interface RepairCycleSummary {
  totalIncidents: number;
  incidentsWithDebrief: number;
  incidentsWithLessonsLearned: number;
  incidentsWithChildPerspective: number;
  incidentsWithCompleteRepair: number;
  avgDebriefTurnaroundDays: number | null;
  mostCommonMissingStep: string;
  overallCompletionRate: number | null;
  ofstedNote: string;
}

export interface RepairCycleIntelligenceResponse {
  data: {
    incidentProfiles: IncidentRepairProfile[];
    childSummaries: ChildRepairSummary[];
    summary: RepairCycleSummary;
  };
}

export function useRepairCycleIntelligence() {
  return useQuery<RepairCycleIntelligenceResponse>({
    queryKey: ["repair-cycle-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/repair-cycle-intelligence");
      if (!res.ok) throw new Error("Failed to fetch repair cycle intelligence");
      return res.json();
    },
    staleTime: 60_000,
  });
}
