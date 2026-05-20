import { NextResponse } from "next/server";
import {
  generateWorkforceIntelligence,
} from "@/lib/workforce";
import type { WorkforceRecord, WorkforcePolicy, StaffWorkforceTraining } from "@/lib/workforce";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: WorkforceRecord[] = [
  // Sarah Johnson — fully compliant across multiple categories
  { id: "wf-1", homeId: "home-oak", date: "2026-02-05", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "dbs_compliance", outcome: "compliant", dbsCurrent: true, qualificationMet: true, trainingUpToDate: true, supervisionCurrent: true, documentationComplete: true, timelyRecording: true },
  { id: "wf-2", homeId: "home-oak", date: "2026-03-12", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "qualification_level", outcome: "compliant", dbsCurrent: true, qualificationMet: true, trainingUpToDate: true, supervisionCurrent: true, documentationComplete: true, timelyRecording: true },
  { id: "wf-3", homeId: "home-oak", date: "2026-04-08", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "mandatory_training", outcome: "compliant", dbsCurrent: true, qualificationMet: true, trainingUpToDate: true, supervisionCurrent: true, documentationComplete: true, timelyRecording: false },

  // Tom Richards — some gaps in compliance
  { id: "wf-4", homeId: "home-oak", date: "2026-02-20", staffId: "staff-tom", staffName: "Tom Richards", category: "safeguarding_training", outcome: "compliant", dbsCurrent: true, qualificationMet: true, trainingUpToDate: true, supervisionCurrent: true, documentationComplete: true, timelyRecording: true },
  { id: "wf-5", homeId: "home-oak", date: "2026-03-18", staffId: "staff-tom", staffName: "Tom Richards", category: "supervision_record", outcome: "action_needed", dbsCurrent: true, qualificationMet: true, trainingUpToDate: false, supervisionCurrent: false, documentationComplete: false, timelyRecording: true },
  { id: "wf-6", homeId: "home-oak", date: "2026-04-22", staffId: "staff-tom", staffName: "Tom Richards", category: "restraint_training", outcome: "compliant", dbsCurrent: true, qualificationMet: true, trainingUpToDate: true, supervisionCurrent: true, documentationComplete: true, timelyRecording: true },

  // Lisa Williams — newer staff member, mixed compliance
  { id: "wf-7", homeId: "home-oak", date: "2026-03-25", staffId: "staff-lisa", staffName: "Lisa Williams", category: "first_aid_certification", outcome: "compliant", dbsCurrent: true, qualificationMet: true, trainingUpToDate: true, supervisionCurrent: true, documentationComplete: true, timelyRecording: true },
  { id: "wf-8", homeId: "home-oak", date: "2026-04-15", staffId: "staff-lisa", staffName: "Lisa Williams", category: "medication_competency", outcome: "action_needed", dbsCurrent: true, qualificationMet: false, trainingUpToDate: true, supervisionCurrent: true, documentationComplete: true, timelyRecording: false },
  { id: "wf-9", homeId: "home-oak", date: "2026-05-02", staffId: "staff-lisa", staffName: "Lisa Williams", category: "dbs_compliance", outcome: "compliant", dbsCurrent: true, qualificationMet: true, trainingUpToDate: true, supervisionCurrent: true, documentationComplete: true, timelyRecording: true },

  // Darren Laville — management oversight records
  { id: "wf-10", homeId: "home-oak", date: "2026-03-01", staffId: "staff-darren", staffName: "Darren Laville", category: "qualification_level", outcome: "compliant", dbsCurrent: true, qualificationMet: true, trainingUpToDate: true, supervisionCurrent: true, documentationComplete: true, timelyRecording: true },
  { id: "wf-11", homeId: "home-oak", date: "2026-04-10", staffId: "staff-darren", staffName: "Darren Laville", category: "safeguarding_training", outcome: "compliant", dbsCurrent: true, qualificationMet: true, trainingUpToDate: true, supervisionCurrent: true, documentationComplete: true, timelyRecording: true },
  { id: "wf-12", homeId: "home-oak", date: "2026-05-15", staffId: "staff-darren", staffName: "Darren Laville", category: "supervision_record", outcome: "compliant", dbsCurrent: true, qualificationMet: true, trainingUpToDate: true, supervisionCurrent: false, documentationComplete: false, timelyRecording: true },
];

const demoPolicy: WorkforcePolicy = {
  saferRecruitmentPolicy: true,
  dbsRenewalPolicy: true,
  qualificationFramework: true,
  mandatoryTrainingPolicy: true,
  supervisionPolicy: true,
  agencyStaffPolicy: true,
  workforceDevStrategy: true,
};

const demoStaff: StaffWorkforceTraining[] = [
  { staffId: "staff-sarah", saferRecruitment: true, dbsProcessKnowledge: true, qualificationAssessment: true, supervisionSkills: true, trainingCoordination: true, regulatoryCompliance: true },
  { staffId: "staff-tom", saferRecruitment: true, dbsProcessKnowledge: true, qualificationAssessment: true, supervisionSkills: false, trainingCoordination: false, regulatoryCompliance: true },
  { staffId: "staff-lisa", saferRecruitment: true, dbsProcessKnowledge: true, qualificationAssessment: false, supervisionSkills: true, trainingCoordination: true, regulatoryCompliance: false },
  { staffId: "staff-darren", saferRecruitment: true, dbsProcessKnowledge: true, qualificationAssessment: true, supervisionSkills: true, trainingCoordination: true, regulatoryCompliance: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateWorkforceIntelligence({
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-20",
    records: demoRecords,
    policy: demoPolicy,
    staff: demoStaff,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "workforce", version: "2.0.0" },
    },
  });
}
