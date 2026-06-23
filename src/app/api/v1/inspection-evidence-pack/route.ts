// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSPECTION EVIDENCE PACK API
// GET /api/v1/inspection-evidence-pack
// Returns the full inspection evidence pack compiled from all store data.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeInspectionEvidencePack,
  type EvidencePackInput,
} from "@/lib/evidence/evidence-pack-generator";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // Default period: last 6 months
  const periodTo = today;
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 6);
  const periodFrom = fromDate.toISOString().slice(0, 10);

  const input: EvidencePackInput = {
    today,
    home_id: (store.home as any)?.id ?? "home_oak",
    home_name: (store.home as any)?.name ?? "Chamberlain House",
    period_from: periodFrom,
    period_to: periodTo,
    generated_by: "system",

    youngPeople: store.youngPeople ?? [],
    staff: store.staff ?? [],
    careForms: store.careForms ?? [],
    riskAssessments: store.riskAssessments ?? [],
    incidents: store.incidents ?? [],
    missingEpisodes: store.missingEpisodes ?? [],
    exploitationScreenings: store.exploitationScreenings ?? [],
    keyWorkingSessions: store.keyWorkingSessions ?? [],
    keyworkerSessions: store.keyworkerSessions ?? [],
    educationRecords: store.educationRecords ?? [],
    healthAssessments: store.healthAssessments ?? [],
    dentalRecords: store.dentalRecords ?? [],
    mentalHealthCheckIns: store.mentalHealthCheckIns ?? [],
    annualHealthAssessments: store.annualHealthAssessments ?? [],
    familyTimeSessions: store.familyTimeSessions ?? [],
    contactPlans: store.contactPlans ?? [],
    multiAgencyMeetings: store.multiAgencyMeetings ?? [],
    lacReviews: store.lacReviews ?? [],
    supervisions: store.supervisions ?? [],
    audits: store.audits ?? [],
    qaAuditRecords: store.qaAuditRecords ?? [],
    caseFileAudits: store.caseFileAudits ?? [],
    tasks: store.tasks ?? [],
    dailyLog: store.dailyLog ?? [],
    behaviourLog: store.behaviourLog ?? [],
    restraints: store.restraints ?? [],
    significantEvents: store.significantEvents ?? [],
    notifiableEvents: store.notifiableEvents ?? [],
    outcomeTargets: store.outcomeTargets ?? [],
    outcomeReviews: store.outcomeReviews ?? [],
    trainingRecords: store.trainingRecords ?? [],
    medications: store.medications ?? [],
    medicationAdministrations: store.medicationAdministrations ?? [],
    independenceSkillsRecords: store.independenceSkillsRecords ?? [],
    disclosures: store.disclosures ?? [],
    safeguardingReferrals: (store as any).safeguardingReferrals ?? [],
    complaintOutcomeRecords: store.complaintOutcomeRecords ?? [],
    chronology: store.chronology ?? [],
    handovers: store.handovers ?? [],
    therapeuticChildImpact: store.therapeuticChildImpact ?? [],
    ypFeedback: store.ypFeedback ?? [],
    advocacyRecords: store.advocacyRecords ?? [],
    participationEntries: store.participationEntries ?? [],
    improvementObjectives: store.improvementObjectives ?? [],
    lessonsLearned: store.lessonsLearned ?? [],

    // 23/06 Practice Intelligence Update — record-based module evidence
    restrictionReviews: store.restrictionReviews ?? [],
    postIncidentReflections: store.postIncidentReflections ?? [],
    stayingSafePlans: store.stayingSafePlans ?? [],
    relationshipEntries: store.relationshipEntries ?? [],
  };

  const result = computeInspectionEvidencePack(input);
  return NextResponse.json({ data: result });
}
