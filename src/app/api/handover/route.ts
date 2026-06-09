import { NextResponse } from "next/server";
import {
  generateHandoverIntelligence,
} from "@/lib/handover";
import type {
  HandoverRecord,
  HandoverPolicy,
  StaffHandoverTraining,
} from "@/lib/handover";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: HandoverRecord[];
  policy: HandoverPolicy;
  training: StaffHandoverTraining[];
} {
  const records: HandoverRecord[] = [
    // Alex — shift handover, medication handover, incident handover, child update
    { id: "ho-001", homeId: "oak-house", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "shift_handover", outcome: "fully_communicated", allChildrenCovered: true, medicationStatusUpdated: true, incidentsCommunicated: true, tasksHandedOver: true, documentationComplete: true, timelyRecording: true },
    { id: "ho-002", homeId: "oak-house", date: "2026-02-03", childId: "child-alex", childName: "Alex", category: "medication_handover", outcome: "fully_communicated", allChildrenCovered: true, medicationStatusUpdated: true, incidentsCommunicated: true, tasksHandedOver: true, documentationComplete: true, timelyRecording: true },
    { id: "ho-003", homeId: "oak-house", date: "2026-02-20", childId: "child-alex", childName: "Alex", category: "incident_handover", outcome: "fully_communicated", allChildrenCovered: true, medicationStatusUpdated: true, incidentsCommunicated: true, tasksHandedOver: false, documentationComplete: true, timelyRecording: true },
    { id: "ho-004", homeId: "oak-house", date: "2026-03-10", childId: "child-alex", childName: "Alex", category: "child_update", outcome: "fully_communicated", allChildrenCovered: true, medicationStatusUpdated: true, incidentsCommunicated: true, tasksHandedOver: true, documentationComplete: true, timelyRecording: true },

    // Jordan — risk update, appointment reminder, contact update, task completion
    { id: "ho-005", homeId: "oak-house", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "risk_update", outcome: "fully_communicated", allChildrenCovered: true, medicationStatusUpdated: true, incidentsCommunicated: true, tasksHandedOver: true, documentationComplete: true, timelyRecording: true },
    { id: "ho-006", homeId: "oak-house", date: "2026-02-10", childId: "child-jordan", childName: "Jordan", category: "appointment_reminder", outcome: "partially_communicated", allChildrenCovered: true, medicationStatusUpdated: false, incidentsCommunicated: true, tasksHandedOver: true, documentationComplete: true, timelyRecording: false },
    { id: "ho-007", homeId: "oak-house", date: "2026-02-28", childId: "child-jordan", childName: "Jordan", category: "contact_update", outcome: "fully_communicated", allChildrenCovered: true, medicationStatusUpdated: true, incidentsCommunicated: true, tasksHandedOver: true, documentationComplete: true, timelyRecording: true },
    { id: "ho-008", homeId: "oak-house", date: "2026-03-15", childId: "child-jordan", childName: "Jordan", category: "task_completion", outcome: "follow_up_required", allChildrenCovered: false, medicationStatusUpdated: true, incidentsCommunicated: false, tasksHandedOver: true, documentationComplete: false, timelyRecording: true },

    // Morgan — shift handover, medication handover, incident handover, risk update
    { id: "ho-009", homeId: "oak-house", date: "2026-01-25", childId: "child-morgan", childName: "Morgan", category: "shift_handover", outcome: "fully_communicated", allChildrenCovered: true, medicationStatusUpdated: true, incidentsCommunicated: true, tasksHandedOver: true, documentationComplete: true, timelyRecording: true },
    { id: "ho-010", homeId: "oak-house", date: "2026-02-15", childId: "child-morgan", childName: "Morgan", category: "medication_handover", outcome: "fully_communicated", allChildrenCovered: true, medicationStatusUpdated: true, incidentsCommunicated: true, tasksHandedOver: true, documentationComplete: true, timelyRecording: true },
    { id: "ho-011", homeId: "oak-house", date: "2026-03-05", childId: "child-morgan", childName: "Morgan", category: "incident_handover", outcome: "information_gap", allChildrenCovered: true, medicationStatusUpdated: true, incidentsCommunicated: false, tasksHandedOver: true, documentationComplete: true, timelyRecording: true },
    { id: "ho-012", homeId: "oak-house", date: "2026-03-20", childId: "child-morgan", childName: "Morgan", category: "risk_update", outcome: "fully_communicated", allChildrenCovered: true, medicationStatusUpdated: true, incidentsCommunicated: true, tasksHandedOver: true, documentationComplete: true, timelyRecording: true },
  ];

  const policy: HandoverPolicy = {
    handoverPolicy: true,
    shiftHandoverProcedure: true,
    medicationHandoverProtocol: true,
    incidentCommunicationPolicy: true,
    taskTrackingProcedure: true,
    handoverRecordKeeping: true,
    handoverAuditPolicy: true,
  };

  const training: StaffHandoverTraining[] = [
    { staffId: "staff-sarah", handoverCommunication: true, medicationHandoverSkills: true, incidentReporting: true, taskPrioritisation: true, childStatusAssessment: true, handoverDocumentation: true },
    { staffId: "staff-tom", handoverCommunication: true, medicationHandoverSkills: true, incidentReporting: true, taskPrioritisation: true, childStatusAssessment: true, handoverDocumentation: false },
    { staffId: "staff-lisa", handoverCommunication: true, medicationHandoverSkills: true, incidentReporting: true, taskPrioritisation: false, childStatusAssessment: true, handoverDocumentation: true },
    { staffId: "staff-darren", handoverCommunication: true, medicationHandoverSkills: true, incidentReporting: true, taskPrioritisation: true, childStatusAssessment: true, handoverDocumentation: true },
  ];

  return { records, policy, training };
}

// ── GET Handler ──────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, training } = generateDemoData();

  const result = generateHandoverIntelligence(
    records,
    policy,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "handover",
        version: "2.0.0",
      },
    },
  });
}
