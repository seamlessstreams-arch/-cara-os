import { useQuery } from "@tanstack/react-query";

export type StaffComplianceSignal = "urgent" | "attention" | "due_soon" | "good";

export interface DbsStatus {
  ageMonths: number;
  hasUpdateService: boolean;
  renewalDue: boolean;
  renewalOverdue: boolean;
}

export interface SupervisionStatus {
  nextDue: string | null;
  daysUntilDue: number | null;
  overdue: boolean;
  dueWithinWeek: boolean;
}

export interface AppraisalStatus {
  nextDue: string | null;
  daysUntilDue: number | null;
  overdue: boolean;
  notScheduled: boolean;
}

export interface ProbationStatus {
  onProbation: boolean;
  endDate: string | null;
  daysRemaining: number | null;
  endingSoon: boolean;
}

export interface StaffComplianceProfile {
  staffId: string;
  name: string;
  role: string;
  jobTitle: string;
  startDate: string;
  employmentType: string;
  dbs: DbsStatus;
  supervision: SupervisionStatus;
  appraisal: AppraisalStatus;
  probation: ProbationStatus;
  issues: string[];
  signal: StaffComplianceSignal;
}

export interface StaffComplianceSummary {
  totalActiveStaff: number;
  supervisionOverdue: number;
  supervisionDueWithinWeek: number;
  appraisalOverdue: number;
  dbsRenewalDue: number;
  onProbation: number;
  signal: StaffComplianceSignal;
}

export interface StaffComplianceTimelineResponse {
  data: {
    staff: StaffComplianceProfile[];
    summary: StaffComplianceSummary;
  };
}

export function useStaffComplianceTimelineIntelligence() {
  return useQuery<StaffComplianceTimelineResponse>({
    queryKey: ["staff-compliance-timeline-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-compliance-timeline-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff compliance timeline intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });
}
