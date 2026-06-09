import { NextResponse } from "next/server";
import {
  generateRestraintIntelligence,
} from "@/lib/restraint";
import type {
  RestraintRecord,
  RestraintPolicy,
  StaffRestraintTraining,
} from "@/lib/restraint";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: RestraintRecord[];
  policy: RestraintPolicy;
  staff: StaffRestraintTraining[];
} {
  const records: RestraintRecord[] = [
    // Alex — 4 records across 4 categories
    { id: "rec-001", homeId: "oak-house", date: "2026-01-22", childId: "child-alex", childName: "Alex", category: "physical_intervention", outcome: "restraint_applied", deEscalationAttempted: true, debriefCompleted: true, bodyMapRecorded: true, parentNotified: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-002", homeId: "oak-house", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "de_escalation", outcome: "de_escalation_successful", deEscalationAttempted: true, debriefCompleted: true, bodyMapRecorded: true, parentNotified: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-003", homeId: "oak-house", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "post_incident_debrief", outcome: "no_further_action", deEscalationAttempted: true, debriefCompleted: true, bodyMapRecorded: true, parentNotified: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-004", homeId: "oak-house", date: "2026-04-12", childId: "child-alex", childName: "Alex", category: "body_map_record", outcome: "not_applicable", deEscalationAttempted: true, debriefCompleted: true, bodyMapRecorded: true, parentNotified: true, documentationComplete: true, timelyRecording: true },

    // Jordan — 4 records across 4 categories, some gaps
    { id: "rec-005", homeId: "oak-house", date: "2026-02-14", childId: "child-jordan", childName: "Jordan", category: "medical_check", outcome: "injury_reported", deEscalationAttempted: true, debriefCompleted: true, bodyMapRecorded: true, parentNotified: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-006", homeId: "oak-house", date: "2026-03-18", childId: "child-jordan", childName: "Jordan", category: "notification_to_parent", outcome: "restraint_applied", deEscalationAttempted: true, debriefCompleted: true, bodyMapRecorded: true, parentNotified: true, documentationComplete: true, timelyRecording: false },
    { id: "rec-007", homeId: "oak-house", date: "2026-04-05", childId: "child-jordan", childName: "Jordan", category: "notification_to_ofsted", outcome: "restraint_applied", deEscalationAttempted: true, debriefCompleted: false, bodyMapRecorded: true, parentNotified: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-008", homeId: "oak-house", date: "2026-05-01", childId: "child-jordan", childName: "Jordan", category: "review_of_technique", outcome: "no_further_action", deEscalationAttempted: true, debriefCompleted: true, bodyMapRecorded: true, parentNotified: false, documentationComplete: true, timelyRecording: true },

    // Morgan — 4 records, some quality gaps
    { id: "rec-009", homeId: "oak-house", date: "2026-01-30", childId: "child-morgan", childName: "Morgan", category: "physical_intervention", outcome: "restraint_applied", deEscalationAttempted: false, debriefCompleted: true, bodyMapRecorded: true, parentNotified: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-010", homeId: "oak-house", date: "2026-02-28", childId: "child-morgan", childName: "Morgan", category: "de_escalation", outcome: "de_escalation_successful", deEscalationAttempted: true, debriefCompleted: true, bodyMapRecorded: true, parentNotified: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-011", homeId: "oak-house", date: "2026-03-28", childId: "child-morgan", childName: "Morgan", category: "post_incident_debrief", outcome: "no_further_action", deEscalationAttempted: true, debriefCompleted: false, bodyMapRecorded: false, parentNotified: true, documentationComplete: false, timelyRecording: true },
    { id: "rec-012", homeId: "oak-house", date: "2026-05-10", childId: "child-morgan", childName: "Morgan", category: "medical_check", outcome: "not_applicable", deEscalationAttempted: true, debriefCompleted: true, bodyMapRecorded: true, parentNotified: true, documentationComplete: true, timelyRecording: false },
  ];

  const policy: RestraintPolicy = {
    restraintPolicy: true,
    deEscalationPolicy: true,
    postIncidentDebriefPolicy: true,
    bodyMapPolicy: true,
    notificationProcedure: true,
    techniqueReviewPolicy: true,
    reductionStrategyPolicy: true,
  };

  const staff: StaffRestraintTraining[] = [
    { staffId: "staff-sarah", approvedTechniqueTraining: true, deEscalationSkills: true, postIncidentDebrief: true, bodyMapRecording: true, notificationProcedures: true, reductionStrategyKnowledge: true },
    { staffId: "staff-tom", approvedTechniqueTraining: true, deEscalationSkills: true, postIncidentDebrief: true, bodyMapRecording: true, notificationProcedures: true, reductionStrategyKnowledge: false },
    { staffId: "staff-lisa", approvedTechniqueTraining: true, deEscalationSkills: true, postIncidentDebrief: true, bodyMapRecording: false, notificationProcedures: true, reductionStrategyKnowledge: true },
    { staffId: "staff-darren", approvedTechniqueTraining: true, deEscalationSkills: true, postIncidentDebrief: true, bodyMapRecording: true, notificationProcedures: true, reductionStrategyKnowledge: true },
  ];

  return { records, policy, staff };
}

// ── GET Handler ──────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, staff } = generateDemoData();

  const result = generateRestraintIntelligence({
    homeId: "oak-house",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-20",
    records,
    policy,
    staff,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "restraint",
        version: "2.0.0",
      },
    },
  });
}
