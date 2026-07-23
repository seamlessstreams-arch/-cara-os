import { useQuery } from "@tanstack/react-query";

export type TrainingSignal = "non_compliant" | "expiring" | "compliant" | "not_recorded";

export interface TrainingIssue {
  courseName: string;
  category: string;
  status: string;
  expiryDate: string | null;
  notes: string | null;
}

export interface StaffTrainingProfile {
  staffId: string;
  staffName: string;
  role: string;
  totalRecords: number;
  mandatoryTotal: number;
  mandatoryCompliant: number;
  mandatoryExpiringSoon: number;
  mandatoryExpired: number;
  mandatoryNotStarted: number;
  complianceRate: number | null;
  issues: TrainingIssue[];
  signal: TrainingSignal;
  supervisionPrompt: string;
}

export interface CategoryRisk {
  category: string;
  affectedStaff: number;
  statuses: string[];
}

export interface TrainingComplianceSummary {
  totalStaff: number;
  compliantStaff: number;
  notRecordedStaff: number;
  expiringStaff: number;
  nonCompliantStaff: number;
  overallMandatoryComplianceRate: number | null;
  totalMandatoryRecords: number;
  compliantMandatoryRecords: number;
  expiringSoonRecords: number;
  expiredRecords: number;
  notStartedRecords: number;
  categoriesAtRisk: CategoryRisk[];
  ofstedNote: string;
}

export interface StaffTrainingComplianceResponse {
  data: {
    staffProfiles: StaffTrainingProfile[];
    summary: TrainingComplianceSummary;
  };
}

export function useStaffTrainingComplianceIntelligence() {
  return useQuery<StaffTrainingComplianceResponse>({
    queryKey: ["staff-training-compliance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-training-compliance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff training compliance intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });
}
