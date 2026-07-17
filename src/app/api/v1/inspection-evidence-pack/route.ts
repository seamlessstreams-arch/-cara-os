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
import { buildSopRealityCheck } from "@/lib/sop-reality-check/sop-reality-check-engine";
import { buildOrgRiskDashboard } from "@/lib/org-risk/org-risk-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // Default period: last 6 months
  const periodTo = today;
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 6);
  const periodFrom = fromDate.toISOString().slice(0, 10);

  // Whole-home assurance engines — computed here (each reads a wide slice of the
  // store) and passed in so the pack generator stays a pure mapping. Mirrors the
  // /api/v1/sop-reality-check and /api/v1/org-risk routes exactly.
  const nowIso = new Date().toISOString();
  const sopChildren = ((store.youngPeople ?? []) as any[])
    .filter((yp) => yp.status === "current")
    .map((yp) => ({
      id: yp.id as string,
      name: yp.preferred_name || yp.first_name || "Child",
    }));
  const sopRealityCheck = buildSopRealityCheck({
    now: nowIso,
    children: sopChildren,
    carePlans: (store as any).carePlans ?? [],
    dailyLog: (store.dailyLog ?? []) as { child_id: string; date?: string }[],
    keyWorkingSessions: store.keyWorkingSessions ?? [],
    incidents: store.incidents ?? [],
    debriefRecords: store.debriefRecords ?? [],
    riskAssessments: store.riskAssessments ?? [],
    lacReviews: store.lacReviews ?? [],
    positiveAchievements: store.positiveAchievements ?? [],
    educationRecords: store.educationRecords ?? [],
    trainingRecords: store.trainingRecords ?? [],
    supervisions: store.supervisions ?? [],
    audits: (store.audits ?? []) as { id: string; created_at?: string; date?: string }[],
  });
  const orgRisk = buildOrgRiskDashboard({
    now: nowIso,
    staff: store.staff ?? [],
    supervisions: store.supervisions ?? [],
    trainingRecords: store.trainingRecords ?? [],
    incidents: store.incidents ?? [],
    missing: store.missingEpisodes ?? [],
    complaints: (store.complaints ?? []) as { date?: string; created_at?: string }[],
    leave: store.leaveRequests ?? [],
  });

  const input: EvidencePackInput = {
    today,
    home_id: (store.home as any)?.id ?? "home_oak",
    home_name: (store.home as any)?.name?.trim() || "This home",
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

    // Whole-home assurance (pre-computed above)
    sopRealityCheck,
    orgRisk,
  };

  const result = computeInspectionEvidencePack(input);
  return NextResponse.json({ data: result });
}
