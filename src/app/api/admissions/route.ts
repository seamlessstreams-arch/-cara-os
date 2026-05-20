import { NextResponse } from "next/server";
import {
  generateAdmissionsIntelligence,
} from "@/lib/admissions";
import type { AdmissionRecord, AdmissionPolicy, StaffAdmissionTraining } from "@/lib/admissions";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: AdmissionRecord[] = [
  // Alex — thorough admission process across multiple categories
  { id: "adm-1", childId: "child-alex", childName: "Alex", admissionDate: "2026-01-15", category: "pre_admission_assessment", thoroughAssessment: true, childConsulted: true, impactOnResidentsConsidered: true, transitionPlanInPlace: true, documentationComplete: true, timelyProcess: true },
  { id: "adm-2", childId: "child-alex", childName: "Alex", admissionDate: "2026-01-15", category: "matching_process", thoroughAssessment: true, childConsulted: true, impactOnResidentsConsidered: true, transitionPlanInPlace: true, documentationComplete: true, timelyProcess: true },
  { id: "adm-3", childId: "child-alex", childName: "Alex", admissionDate: "2026-01-15", category: "child_participation", thoroughAssessment: true, childConsulted: true, impactOnResidentsConsidered: true, transitionPlanInPlace: true, documentationComplete: true, timelyProcess: true },
  { id: "adm-4", childId: "child-alex", childName: "Alex", admissionDate: "2026-01-15", category: "impact_assessment", thoroughAssessment: true, childConsulted: true, impactOnResidentsConsidered: true, transitionPlanInPlace: true, documentationComplete: true, timelyProcess: true },

  // Jordan — mostly good but some gaps in process
  { id: "adm-5", childId: "child-jordan", childName: "Jordan", admissionDate: "2026-02-20", category: "pre_admission_assessment", thoroughAssessment: true, childConsulted: true, impactOnResidentsConsidered: true, transitionPlanInPlace: true, documentationComplete: true, timelyProcess: true },
  { id: "adm-6", childId: "child-jordan", childName: "Jordan", admissionDate: "2026-02-20", category: "matching_process", thoroughAssessment: true, childConsulted: true, impactOnResidentsConsidered: true, transitionPlanInPlace: false, documentationComplete: true, timelyProcess: true },
  { id: "adm-7", childId: "child-jordan", childName: "Jordan", admissionDate: "2026-02-20", category: "transition_planning", thoroughAssessment: true, childConsulted: false, impactOnResidentsConsidered: true, transitionPlanInPlace: true, documentationComplete: true, timelyProcess: false },
  { id: "adm-8", childId: "child-jordan", childName: "Jordan", admissionDate: "2026-02-20", category: "family_consultation", thoroughAssessment: false, childConsulted: true, impactOnResidentsConsidered: true, transitionPlanInPlace: true, documentationComplete: false, timelyProcess: true },

  // Morgan — emergency placement, some areas incomplete
  { id: "adm-9", childId: "child-morgan", childName: "Morgan", admissionDate: "2026-03-10", category: "pre_admission_assessment", thoroughAssessment: true, childConsulted: true, impactOnResidentsConsidered: true, transitionPlanInPlace: false, documentationComplete: true, timelyProcess: true },
  { id: "adm-10", childId: "child-morgan", childName: "Morgan", admissionDate: "2026-03-10", category: "placement_planning", thoroughAssessment: true, childConsulted: true, impactOnResidentsConsidered: false, transitionPlanInPlace: false, documentationComplete: true, timelyProcess: false },
  { id: "adm-11", childId: "child-morgan", childName: "Morgan", admissionDate: "2026-03-10", category: "information_gathering", thoroughAssessment: true, childConsulted: false, impactOnResidentsConsidered: true, transitionPlanInPlace: true, documentationComplete: true, timelyProcess: true },
  { id: "adm-12", childId: "child-morgan", childName: "Morgan", admissionDate: "2026-03-10", category: "child_participation", thoroughAssessment: false, childConsulted: true, impactOnResidentsConsidered: true, transitionPlanInPlace: true, documentationComplete: false, timelyProcess: true },
];

const demoPolicy: AdmissionPolicy = {
  id: "pol-adm-1",
  admissionsPolicy: true,
  matchingCriteria: true,
  transitionProtocol: true,
  impactAssessmentFramework: true,
  childParticipationGuidance: true,
  emergencyAdmissionProcedure: true,
  reviewSchedule: true,
};

const demoStaff: StaffAdmissionTraining[] = [
  { id: "t-1", staffId: "staff-sarah", staffName: "Sarah Johnson", assessmentSkills: true, matchingExpertise: true, transitionPlanning: true, childParticipationSkills: true, riskAssessment: true, familyEngagement: true },
  { id: "t-2", staffId: "staff-tom", staffName: "Tom Richards", assessmentSkills: true, matchingExpertise: true, transitionPlanning: true, childParticipationSkills: false, riskAssessment: true, familyEngagement: false },
  { id: "t-3", staffId: "staff-lisa", staffName: "Lisa Williams", assessmentSkills: true, matchingExpertise: true, transitionPlanning: true, childParticipationSkills: true, riskAssessment: false, familyEngagement: true },
  { id: "t-4", staffId: "staff-darren", staffName: "Darren Laville", assessmentSkills: true, matchingExpertise: true, transitionPlanning: true, childParticipationSkills: true, riskAssessment: true, familyEngagement: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateAdmissionsIntelligence(
    demoRecords,
    demoPolicy,
    demoStaff,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "admissions", version: "2.0.0" },
    },
  });
}
