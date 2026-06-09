import { NextResponse } from "next/server";
import {
  generateContactIntelligence,
} from "@/lib/contact";
import type {
  ContactRecord,
  ContactPolicy,
  StaffContactTraining,
} from "@/lib/contact";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: ContactRecord[];
  policy: ContactPolicy;
  staff: StaffContactTraining[];
} {
  const records: ContactRecord[] = [
    // Alex — family visits & supervised contact
    { id: "rec-001", childId: "child-alex", childName: "Alex", contactDate: "2026-01-20", category: "family_visit", childPrepared: true, contactPlanFollowed: true, childViewCaptured: true, safetyMeasuresInPlace: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-002", childId: "child-alex", childName: "Alex", contactDate: "2026-02-10", category: "supervised_contact", childPrepared: true, contactPlanFollowed: true, childViewCaptured: true, safetyMeasuresInPlace: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-003", childId: "child-alex", childName: "Alex", contactDate: "2026-03-05", category: "phone_call", childPrepared: true, contactPlanFollowed: true, childViewCaptured: true, safetyMeasuresInPlace: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-004", childId: "child-alex", childName: "Alex", contactDate: "2026-03-25", category: "sibling_contact", childPrepared: true, contactPlanFollowed: true, childViewCaptured: true, safetyMeasuresInPlace: true, documentationComplete: true, timelyRecording: false },

    // Jordan — mixed quality
    { id: "rec-005", childId: "child-jordan", childName: "Jordan", contactDate: "2026-01-15", category: "family_visit", childPrepared: true, contactPlanFollowed: true, childViewCaptured: true, safetyMeasuresInPlace: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-006", childId: "child-jordan", childName: "Jordan", contactDate: "2026-02-20", category: "video_call", childPrepared: true, contactPlanFollowed: true, childViewCaptured: false, safetyMeasuresInPlace: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-007", childId: "child-jordan", childName: "Jordan", contactDate: "2026-03-10", category: "letterbox_contact", childPrepared: false, contactPlanFollowed: true, childViewCaptured: true, safetyMeasuresInPlace: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-008", childId: "child-jordan", childName: "Jordan", contactDate: "2026-04-05", category: "professional_meeting", childPrepared: true, contactPlanFollowed: false, childViewCaptured: true, safetyMeasuresInPlace: true, documentationComplete: false, timelyRecording: false },

    // Morgan — good overall
    { id: "rec-009", childId: "child-morgan", childName: "Morgan", contactDate: "2026-01-25", category: "family_visit", childPrepared: true, contactPlanFollowed: true, childViewCaptured: true, safetyMeasuresInPlace: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-010", childId: "child-morgan", childName: "Morgan", contactDate: "2026-02-15", category: "unsupervised_contact", childPrepared: true, contactPlanFollowed: true, childViewCaptured: true, safetyMeasuresInPlace: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-011", childId: "child-morgan", childName: "Morgan", contactDate: "2026-03-20", category: "phone_call", childPrepared: true, contactPlanFollowed: true, childViewCaptured: true, safetyMeasuresInPlace: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-012", childId: "child-morgan", childName: "Morgan", contactDate: "2026-04-10", category: "supervised_contact", childPrepared: true, contactPlanFollowed: true, childViewCaptured: true, safetyMeasuresInPlace: false, documentationComplete: true, timelyRecording: true },
  ];

  const policy: ContactPolicy = {
    id: "pol-001",
    contactPolicy: true,
    supervisedContactGuidelines: true,
    riskAssessmentProtocol: true,
    childParticipationFramework: true,
    familyEngagementStrategy: true,
    emergencyContactProcedure: true,
    reviewSchedule: true,
  };

  const staff: StaffContactTraining[] = [
    { id: "tr-001", staffId: "staff-sarah", staffName: "Sarah Johnson", contactSupervision: true, safeguardingAwareness: true, childCommunication: true, familyMediation: true, riskManagement: true, recordKeeping: true },
    { id: "tr-002", staffId: "staff-tom", staffName: "Tom Richards", contactSupervision: true, safeguardingAwareness: true, childCommunication: true, familyMediation: false, riskManagement: true, recordKeeping: false },
    { id: "tr-003", staffId: "staff-lisa", staffName: "Lisa Williams", contactSupervision: true, safeguardingAwareness: true, childCommunication: true, familyMediation: true, riskManagement: false, recordKeeping: true },
    { id: "tr-004", staffId: "staff-darren", staffName: "Darren Laville", contactSupervision: true, safeguardingAwareness: true, childCommunication: true, familyMediation: true, riskManagement: true, recordKeeping: true },
  ];

  return { records, policy, staff };
}

// ── GET Handler ──────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, staff } = generateDemoData();

  const result = generateContactIntelligence(
    records,
    policy,
    staff,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "contact",
        version: "2.0.0",
      },
    },
  });
}
