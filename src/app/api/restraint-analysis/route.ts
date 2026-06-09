// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Restraint Analysis Intelligence API Route
//
// GET  → returns Chamberlain House demo restraint analysis intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateRestraintAnalysisIntelligence } from "@/lib/restraint-analysis/restraint-analysis-engine";
import type {
  RestraintRecord,
  RestraintReduction,
  RestraintTraining,
} from "@/lib/restraint-analysis/restraint-analysis-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const records: RestraintRecord[] = [
    // Alex — restraint following contact visit distress
    {
      id: "r-a1", homeId: "oak-house", childId: "child-alex", childName: "Alex",
      date: "2025-02-10", startTime: "14:30", endTime: "14:33", durationMinutes: 3,
      restraintType: "physical_intervention", reason: "risk_to_self",
      staffInvolved: ["Sarah Johnson", "Tom Richards"],
      deEscalationAttempted: true,
      deEscalationTechniques: ["verbal_reassurance", "distraction", "choices_offered"],
      postIncidentActions: ["child_debrief", "medical_check", "body_map_completed", "written_record", "manager_review", "ofsted_notified", "parent_notified", "social_worker_notified"],
      childInjured: false, staffInjured: false, childViewsRecorded: true,
      childViews: "I was upset about contact not going well. I didn't want to be held but I understand why.",
      proportionalityAssessed: true, approvedTechniqueUsed: true, managerNotifiedImmediately: true,
    },
    // Alex — second restraint, guided away during peer conflict
    {
      id: "r-a2", homeId: "oak-house", childId: "child-alex", childName: "Alex",
      date: "2025-04-22", startTime: "17:15", endTime: "17:18", durationMinutes: 3,
      restraintType: "guided_away", reason: "risk_to_others",
      staffInvolved: ["Tom Richards"],
      deEscalationAttempted: true,
      deEscalationTechniques: ["verbal_reassurance", "change_of_environment", "active_listening"],
      postIncidentActions: ["child_debrief", "medical_check", "body_map_completed", "written_record", "manager_review", "ofsted_notified"],
      childInjured: false, staffInjured: false, childViewsRecorded: true,
      childViews: "I was angry with Jordan but I know I should have walked away.",
      proportionalityAssessed: true, approvedTechniqueUsed: true, managerNotifiedImmediately: true,
    },
    // Morgan — restraint during self-harm episode
    {
      id: "r-m1", homeId: "oak-house", childId: "child-morgan", childName: "Morgan",
      date: "2025-03-15", startTime: "20:45", endTime: "20:53", durationMinutes: 8,
      restraintType: "physical_intervention", reason: "risk_to_self",
      staffInvolved: ["Lisa Williams", "Sarah Johnson"],
      deEscalationAttempted: true,
      deEscalationTechniques: ["verbal_reassurance", "time_away"],
      postIncidentActions: ["written_record", "manager_review", "ofsted_notified", "medical_check", "body_map_completed", "social_worker_notified"],
      childInjured: false, staffInjured: false, childViewsRecorded: false,
      proportionalityAssessed: true, approvedTechniqueUsed: true, managerNotifiedImmediately: true,
    },
  ];

  const reductions: RestraintReduction[] = [
    {
      id: "red-a1", homeId: "oak-house", childId: "child-alex", childName: "Alex",
      planInPlace: true, planReviewDate: "2025-07-01",
      targetReduction: "Reduce restraint incidents to zero over 6 months through enhanced transition planning and de-escalation",
      currentStrategies: ["Visual schedule for transitions", "Sensory breaks available", "Choice boards during unstructured time", "Pre-contact preparation routine"],
      triggerAwarenessDocumented: true, alternativeStrategiesIdentified: 5, sensoryProfileCompleted: true,
    },
    {
      id: "red-m1", homeId: "oak-house", childId: "child-morgan", childName: "Morgan",
      planInPlace: true, planReviewDate: "2025-08-01",
      targetReduction: "Reduce through improved evening routine and CAMHS-informed coping strategies",
      currentStrategies: ["Evening routine structure with choices", "CAMHS coping toolkit", "Sensory grounding tools", "Safe space identified"],
      triggerAwarenessDocumented: true, alternativeStrategiesIdentified: 4, sensoryProfileCompleted: false,
    },
  ];

  const training: RestraintTraining[] = [
    { id: "tr-1", homeId: "oak-house", staffId: "staff-sarah", staffName: "Sarah Johnson", trainingType: "PROACT-SCIPr", completedDate: "2025-01-15", expiryDate: "2026-01-15", refresherDue: false },
    { id: "tr-2", homeId: "oak-house", staffId: "staff-tom", staffName: "Tom Richards", trainingType: "PROACT-SCIPr", completedDate: "2025-01-15", expiryDate: "2026-01-15", refresherDue: false },
    { id: "tr-3", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", trainingType: "PROACT-SCIPr", completedDate: "2025-02-01", expiryDate: "2026-02-01", refresherDue: false },
    { id: "tr-4", homeId: "oak-house", staffId: "staff-darren", staffName: "Darren Laville", trainingType: "PROACT-SCIPr", completedDate: "2024-11-01", expiryDate: "2025-11-01", refresherDue: false },
  ];

  return { records, reductions, training };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { records, reductions, training } = getDemoData();
    const result = generateRestraintAnalysisIntelligence(
      records, reductions, training,
      "oak-house", "2025-01-01", "2025-06-30",
      new Date().toISOString().split("T")[0],
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate restraint analysis intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records, reductions, training, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(records) || !Array.isArray(reductions) || !Array.isArray(training)) {
      return NextResponse.json(
        { error: "records, reductions, and training must be arrays" },
        { status: 400 },
      );
    }

    const result = generateRestraintAnalysisIntelligence(
      records, reductions, training,
      homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process restraint analysis data", details: String(error) },
      { status: 500 },
    );
  }
}
