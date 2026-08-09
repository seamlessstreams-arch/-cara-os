// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSPECTION EVIDENCE PACK API
// GET /api/v1/inspection-evidence-pack
// Returns the full inspection evidence pack compiled from all store data.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeInspectionEvidencePack,
  type EvidencePackInput,
} from "@/lib/evidence/evidence-pack-generator";
import { buildSopRealityCheck } from "@/lib/sop-reality-check/sop-reality-check-engine";
import { buildOrgRiskDashboard } from "@/lib/org-risk/org-risk-engine";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const [advocacyRecordsList, annualHealthAssessmentsList, auditsList, behaviourLogList, careFormsList, carePlansList, caseFileAuditsList, chronologyList, complaintOutcomeRecordsList, complaintsList, contactPlansList, dailyLogList, debriefRecordsList, dentalRecordsList, disclosuresList, educationRecordsList, exploitationScreeningsList, familyTimeSessionsList, handoversList, healthAssessmentsList, improvementObjectivesList, incidentsList, independenceSkillsRecordsList, keyWorkingSessionsList, keyworkerSessionsList, lacReviewsList, leaveRequestsList, lessonsLearnedList, medicationAdministrationsList, medicationsList, mentalHealthCheckInsList, missingEpisodesList, multiAgencyMeetingsList, notifiableEventsList, outcomeReviewsList, outcomeTargetsList, participationEntriesList, positiveAchievementsList, postIncidentReflectionsList, qaAuditRecordsList, relationshipEntriesList, restraintsList, restrictionReviewsList, riskAssessmentsList, significantEventsList, staffList, stayingSafePlansList, supervisionsList, tasksList, therapeuticChildImpactList, trainingRecordsList, youngPeopleList, ypFeedbackList, homeRec] = await Promise.all([dal.advocacyRecords.findAll(), dal.annualHealthAssessments.findAll(), dal.audits.findAll(), dal.behaviourLog.findAll(), dal.careForms.findAll(), dal.carePlans.findAll(), dal.caseFileAudits.findAll(), dal.chronology.findAll(), dal.complaintOutcomeRecords.findAll(), dal.complaints.findAll(), dal.contactPlans.findAll(), dal.dailyLog.findAll(), dal.debriefRecords.findAll(), dal.dentalRecords.findAll(), dal.disclosures.findAll(), dal.educationRecords.findAll(), dal.exploitationScreenings.findAll(), dal.familyTimeSessions.findAll(), dal.handovers.findAll(), dal.healthAssessments.findAll(), dal.improvementObjectives.findAll(), dal.incidents.findAll(), dal.independenceSkillsRecords.findAll(), dal.keyWorkingSessions.findAll(), dal.keyworkerSessions.findAll(), dal.lacReviews.findAll(), dal.leaveRequests.findAll(), dal.lessonsLearned.findAll(), dal.medicationAdministrations.findAll(), dal.medications.findAll(), dal.mentalHealthCheckIns.findAll(), dal.missingEpisodes.findAll(), dal.multiAgencyMeetings.findAll(), dal.notifiableEvents.findAll(), dal.outcomeReviews.findAll(), dal.outcomeTargets.findAll(), dal.participationEntries.findAll(), dal.positiveAchievements.findAll(), dal.postIncidentReflections.findAll(), dal.qaAuditRecords.findAll(), dal.relationshipEntries.findAll(), dal.restraints.findAll(), dal.restrictionReviews.findAll(), dal.riskAssessments.findAll(), dal.significantEvents.findAll(), dal.staff.findAll(), dal.stayingSafePlans.findAll(), dal.supervisions.findAll(), dal.tasks.findAll(), dal.therapeuticChildImpact.findAll(), dal.trainingRecords.findAll(), dal.youngPeople.findAll(), dal.ypFeedback.findAll(), dal.home.get()]);
  const today = todayStr();

  // Default period: last 6 months
  const periodTo = today;
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 6);
  const periodFrom = fromDate.toISOString().slice(0, 10);

  // Whole-home assurance engines — computed here (each reads a wide slice of the
  // store) and passed in so the pack generator stays a pure mapping. Mirrors the
  // /api/v1/sop-reality-check and /api/v1/org-risk routes exactly.
  const nowIso = new Date().toISOString();
  const sopChildren = ((youngPeopleList ?? []) as any[])
    .filter((yp) => yp.status === "current")
    .map((yp) => ({
      id: yp.id as string,
      name: yp.preferred_name || yp.first_name || "Child",
    }));
  const sopRealityCheck = buildSopRealityCheck({
    now: nowIso,
    children: sopChildren,
    carePlans: carePlansList ?? [],
    dailyLog: (dailyLogList ?? []) as { child_id: string; date?: string }[],
    keyWorkingSessions: keyWorkingSessionsList ?? [],
    incidents: incidentsList ?? [],
    debriefRecords: debriefRecordsList ?? [],
    riskAssessments: riskAssessmentsList ?? [],
    lacReviews: lacReviewsList ?? [],
    positiveAchievements: positiveAchievementsList ?? [],
    educationRecords: educationRecordsList ?? [],
    trainingRecords: trainingRecordsList ?? [],
    supervisions: supervisionsList ?? [],
    audits: (auditsList ?? []) as { id: string; created_at?: string; date?: string }[],
  });
  const orgRisk = buildOrgRiskDashboard({
    now: nowIso,
    staff: staffList ?? [],
    supervisions: supervisionsList ?? [],
    trainingRecords: trainingRecordsList ?? [],
    incidents: incidentsList ?? [],
    missing: missingEpisodesList ?? [],
    complaints: (complaintsList ?? []) as { date?: string; created_at?: string }[],
    leave: leaveRequestsList ?? [],
  });

  const input: EvidencePackInput = {
    today,
    home_id: (homeRec as any)?.id ?? "home_oak",
    home_name: (homeRec as any)?.name?.trim() || "This home",
    period_from: periodFrom,
    period_to: periodTo,
    generated_by: "system",

    youngPeople: youngPeopleList ?? [],
    staff: staffList ?? [],
    careForms: careFormsList ?? [],
    riskAssessments: riskAssessmentsList ?? [],
    incidents: incidentsList ?? [],
    missingEpisodes: missingEpisodesList ?? [],
    exploitationScreenings: exploitationScreeningsList ?? [],
    keyWorkingSessions: keyWorkingSessionsList ?? [],
    keyworkerSessions: keyworkerSessionsList ?? [],
    educationRecords: educationRecordsList ?? [],
    healthAssessments: healthAssessmentsList ?? [],
    dentalRecords: dentalRecordsList ?? [],
    mentalHealthCheckIns: mentalHealthCheckInsList ?? [],
    annualHealthAssessments: annualHealthAssessmentsList ?? [],
    familyTimeSessions: familyTimeSessionsList ?? [],
    contactPlans: contactPlansList ?? [],
    multiAgencyMeetings: multiAgencyMeetingsList ?? [],
    lacReviews: lacReviewsList ?? [],
    supervisions: supervisionsList ?? [],
    audits: auditsList ?? [],
    qaAuditRecords: qaAuditRecordsList ?? [],
    caseFileAudits: caseFileAuditsList ?? [],
    tasks: tasksList ?? [],
    dailyLog: dailyLogList ?? [],
    behaviourLog: behaviourLogList ?? [],
    restraints: restraintsList ?? [],
    significantEvents: significantEventsList ?? [],
    notifiableEvents: notifiableEventsList ?? [],
    outcomeTargets: outcomeTargetsList ?? [],
    outcomeReviews: outcomeReviewsList ?? [],
    trainingRecords: trainingRecordsList ?? [],
    medications: medicationsList ?? [],
    medicationAdministrations: medicationAdministrationsList ?? [],
    independenceSkillsRecords: independenceSkillsRecordsList ?? [],
    disclosures: disclosuresList ?? [],
    safeguardingReferrals: [], // phantom field — never a real collection; always empty (faithful to the prior always-empty read)
    complaintOutcomeRecords: complaintOutcomeRecordsList ?? [],
    chronology: chronologyList ?? [],
    handovers: handoversList ?? [],
    therapeuticChildImpact: therapeuticChildImpactList ?? [],
    ypFeedback: ypFeedbackList ?? [],
    advocacyRecords: advocacyRecordsList ?? [],
    participationEntries: participationEntriesList ?? [],
    improvementObjectives: improvementObjectivesList ?? [],
    lessonsLearned: lessonsLearnedList ?? [],

    // 23/06 Practice Intelligence Update — record-based module evidence
    restrictionReviews: restrictionReviewsList ?? [],
    postIncidentReflections: postIncidentReflectionsList ?? [],
    stayingSafePlans: stayingSafePlansList ?? [],
    relationshipEntries: relationshipEntriesList ?? [],

    // Whole-home assurance (pre-computed above)
    sopRealityCheck,
    orgRisk,
  };

  const result = computeInspectionEvidencePack(input);
  return NextResponse.json({ data: result });
}
