import { NextResponse } from "next/server";
import {
  generateComplaintsIntelligence,
} from "@/lib/complaints";
import type { ComplaintRecord, ComplaintPolicy, StaffComplaintTraining } from "@/lib/complaints";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: ComplaintRecord[] = [
  // Alex — complaints handled well
  { id: "cmp-1", homeId: "home-oak", date: "2026-02-05", childId: "child-alex", childName: "Alex", category: "care_quality", outcome: "resolved_upheld", acknowledgedWithinTarget: true, investigationThorough: true, childViewCaptured: true, outcomeExplainedToChild: true, documentationComplete: true, timelyResolution: true },
  { id: "cmp-2", homeId: "home-oak", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "staff_conduct", outcome: "resolved_not_upheld", acknowledgedWithinTarget: true, investigationThorough: true, childViewCaptured: true, outcomeExplainedToChild: true, documentationComplete: true, timelyResolution: true },
  { id: "cmp-3", homeId: "home-oak", date: "2026-04-08", childId: "child-alex", childName: "Alex", category: "privacy_dignity", outcome: "resolved_partially", acknowledgedWithinTarget: true, investigationThorough: true, childViewCaptured: true, outcomeExplainedToChild: true, documentationComplete: true, timelyResolution: false },
  { id: "cmp-4", homeId: "home-oak", date: "2026-05-01", childId: "child-alex", childName: "Alex", category: "family_contact", outcome: "resolved_upheld", acknowledgedWithinTarget: true, investigationThorough: true, childViewCaptured: true, outcomeExplainedToChild: false, documentationComplete: true, timelyResolution: true },

  // Jordan — some gaps in process
  { id: "cmp-5", homeId: "home-oak", date: "2026-02-20", childId: "child-jordan", childName: "Jordan", category: "food_nutrition", outcome: "resolved_upheld", acknowledgedWithinTarget: true, investigationThorough: true, childViewCaptured: true, outcomeExplainedToChild: true, documentationComplete: true, timelyResolution: true },
  { id: "cmp-6", homeId: "home-oak", date: "2026-03-18", childId: "child-jordan", childName: "Jordan", category: "environmental", outcome: "resolved_partially", acknowledgedWithinTarget: true, investigationThorough: false, childViewCaptured: true, outcomeExplainedToChild: true, documentationComplete: false, timelyResolution: true },
  { id: "cmp-7", homeId: "home-oak", date: "2026-04-22", childId: "child-jordan", childName: "Jordan", category: "health_medication", outcome: "ongoing", acknowledgedWithinTarget: false, investigationThorough: true, childViewCaptured: true, outcomeExplainedToChild: true, documentationComplete: true, timelyResolution: true },
  { id: "cmp-8", homeId: "home-oak", date: "2026-05-10", childId: "child-jordan", childName: "Jordan", category: "safeguarding_concern", outcome: "resolved_upheld", acknowledgedWithinTarget: true, investigationThorough: true, childViewCaptured: true, outcomeExplainedToChild: true, documentationComplete: true, timelyResolution: true },

  // Morgan — newer, fewer records
  { id: "cmp-9", homeId: "home-oak", date: "2026-03-25", childId: "child-morgan", childName: "Morgan", category: "care_quality", outcome: "resolved_upheld", acknowledgedWithinTarget: true, investigationThorough: true, childViewCaptured: true, outcomeExplainedToChild: true, documentationComplete: true, timelyResolution: true },
  { id: "cmp-10", homeId: "home-oak", date: "2026-04-15", childId: "child-morgan", childName: "Morgan", category: "staff_conduct", outcome: "resolved_not_upheld", acknowledgedWithinTarget: true, investigationThorough: true, childViewCaptured: false, outcomeExplainedToChild: true, documentationComplete: true, timelyResolution: false },
  { id: "cmp-11", homeId: "home-oak", date: "2026-05-02", childId: "child-morgan", childName: "Morgan", category: "food_nutrition", outcome: "withdrawn", acknowledgedWithinTarget: true, investigationThorough: false, childViewCaptured: true, outcomeExplainedToChild: true, documentationComplete: true, timelyResolution: true },
  { id: "cmp-12", homeId: "home-oak", date: "2026-05-15", childId: "child-morgan", childName: "Morgan", category: "environmental", outcome: "ongoing", acknowledgedWithinTarget: true, investigationThorough: true, childViewCaptured: true, outcomeExplainedToChild: true, documentationComplete: false, timelyResolution: true },
];

const demoPolicy: ComplaintPolicy = {
  complaintsPolicy: true,
  investigationProcedure: true,
  childComplaintsGuide: true,
  independentAdvocacyAccess: true,
  escalationFramework: true,
  lessonLearnedProcess: true,
  ofstedNotificationProtocol: true,
};

const demoStaff: StaffComplaintTraining[] = [
  { staffId: "staff-sarah", complaintHandling: true, childAdvocacy: true, investigationSkills: true, recordKeeping: true, conflictResolution: true, regulatoryKnowledge: true },
  { staffId: "staff-tom", complaintHandling: true, childAdvocacy: true, investigationSkills: true, recordKeeping: false, conflictResolution: false, regulatoryKnowledge: true },
  { staffId: "staff-lisa", complaintHandling: true, childAdvocacy: true, investigationSkills: false, recordKeeping: true, conflictResolution: true, regulatoryKnowledge: false },
  { staffId: "staff-darren", complaintHandling: true, childAdvocacy: true, investigationSkills: true, recordKeeping: true, conflictResolution: true, regulatoryKnowledge: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateComplaintsIntelligence({
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
      meta: { generatedAt: new Date().toISOString(), engine: "complaints", version: "2.0.0" },
    },
  });
}
