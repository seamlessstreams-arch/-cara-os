// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Whistleblowing & Professional Courage API Route
//
// GET  → returns Chamberlain House demo whistleblowing intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateWhistleblowingIntelligence } from "@/lib/whistleblowing/whistleblowing-engine";
import type {
  WhistleblowingConcern,
  WhistleblowingPolicy,
  ProfessionalCourageRecord,
  StaffAwarenessRecord,
  CultureIndicator,
} from "@/lib/whistleblowing/whistleblowing-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const concerns: WhistleblowingConcern[] = [
    {
      id: "wc-01", homeId: "oak-house", raisedDate: "2025-02-10", raisedBy: "Tom Richards",
      anonymous: false, category: "poor_practice", description: "Night staff not completing hourly checks consistently",
      raisedWith: "registered_manager", status: "resolved", acknowledgedDate: "2025-02-10",
      investigationStartDate: "2025-02-11", resolvedDate: "2025-02-28",
      outcome: "concern_upheld", actionsTaken: ["Supervision with staff", "Revised night-check protocol", "Spot checks implemented"],
      feedbackToWhistleblower: true, protectionStatus: "no_detriment", escalated: false,
      lessonsLearned: "Night shift protocols need regular audit and supervision support",
    },
    {
      id: "wc-02", homeId: "oak-house", raisedDate: "2025-03-15", raisedBy: "Lisa Williams",
      anonymous: false, category: "medication_error", description: "PRN administered without proper recording for two consecutive shifts",
      raisedWith: "registered_manager", status: "resolved", acknowledgedDate: "2025-03-15",
      investigationStartDate: "2025-03-16", resolvedDate: "2025-04-02",
      outcome: "concern_upheld", actionsTaken: ["Medication audit", "Staff refresher training", "Double-sign process introduced"],
      feedbackToWhistleblower: true, protectionStatus: "no_detriment", escalated: false,
      lessonsLearned: "PRN recording requires additional safeguards and regular competency checks",
    },
    {
      id: "wc-03", homeId: "oak-house", raisedDate: "2025-04-20", raisedBy: "anonymous",
      anonymous: true, category: "safeguarding", description: "Observed staff member using inappropriate language with young person during de-escalation",
      raisedWith: "responsible_individual", status: "escalated", acknowledgedDate: "2025-04-20",
      investigationStartDate: "2025-04-21",
      actionsTaken: ["LADO referral", "Staff member suspended pending investigation", "Practice review initiated"],
      feedbackToWhistleblower: false, protectionStatus: "no_detriment",
      escalated: true, escalatedTo: "LADO",
    },
  ];

  const policy: WhistleblowingPolicy = {
    id: "wp-01", homeId: "oak-house", policyVersion: "3.1",
    lastReviewDate: "2025-01-15", nextReviewDate: "2025-07-15",
    status: "current",
    coversAnonymousReporting: true, coversExternalReporting: true,
    coversProtectionFromDetriment: true, coversEscalationProcess: true,
    accessibleToAllStaff: true, staffSignedAwareness: 8, totalStaff: 8,
  };

  const courageRecords: ProfessionalCourageRecord[] = [
    { id: "pc-01", staffId: "s-01", staffName: "Sarah Johnson", date: "2025-02-20", context: "Staff meeting", action: "Challenged use of restrictive language in daily logs", challengeType: "practice_concern", outcome: "positive_change", supportedByManagement: true, documentedInSupervision: true },
    { id: "pc-02", staffId: "s-02", staffName: "Tom Richards", date: "2025-03-05", context: "Multi-agency meeting", action: "Challenged social worker's proposed placement decision citing risk factors", challengeType: "multi_agency_challenge", outcome: "acknowledged_no_change", supportedByManagement: true, documentedInSupervision: true },
    { id: "pc-03", staffId: "s-03", staffName: "Lisa Williams", date: "2025-03-18", context: "Supervision", action: "Raised concern about medication administration process gaps", challengeType: "safeguarding_alert", outcome: "positive_change", supportedByManagement: true, documentedInSupervision: true },
    { id: "pc-04", staffId: "s-04", staffName: "Darren Laville", date: "2025-04-01", context: "Reg 44 visit debrief", action: "Challenged organisation's response time to Reg 44 recommendations", challengeType: "management_decision", outcome: "positive_change", supportedByManagement: true, documentedInSupervision: true },
    { id: "pc-05", staffId: "s-01", staffName: "Sarah Johnson", date: "2025-04-15", context: "Team meeting", action: "Questioned appropriateness of consequence used with young person", challengeType: "peer_behaviour", outcome: "positive_change", supportedByManagement: true, documentedInSupervision: true },
    { id: "pc-06", staffId: "s-02", staffName: "Tom Richards", date: "2025-05-01", context: "Shift handover", action: "Flagged missed key-worker session and challenged shift lead to reschedule", challengeType: "practice_concern", outcome: "positive_change", supportedByManagement: true, documentedInSupervision: true },
  ];

  const awarenessRecords: StaffAwarenessRecord[] = [
    { id: "sa-01", staffId: "s-01", staffName: "Sarah Johnson", trainingDate: "2025-01-20", trainingType: "refresher", knowsHowToReport: true, knowsExternalRoutes: true, feelsConfidentToRaise: true, understandsProtection: true },
    { id: "sa-02", staffId: "s-02", staffName: "Tom Richards", trainingDate: "2025-01-20", trainingType: "refresher", knowsHowToReport: true, knowsExternalRoutes: true, feelsConfidentToRaise: true, understandsProtection: true },
    { id: "sa-03", staffId: "s-03", staffName: "Lisa Williams", trainingDate: "2025-01-20", trainingType: "refresher", knowsHowToReport: true, knowsExternalRoutes: true, feelsConfidentToRaise: true, understandsProtection: true },
    { id: "sa-04", staffId: "s-04", staffName: "Darren Laville", trainingDate: "2025-01-20", trainingType: "refresher", knowsHowToReport: true, knowsExternalRoutes: true, feelsConfidentToRaise: true, understandsProtection: true },
  ];

  const cultureIndicators: CultureIndicator[] = [
    { id: "ci-01", homeId: "oak-house", date: "2025-01-30", source: "staff_survey", opennesScore: 8, trustInManagement: 9, confidenceToChallenge: 8, fearOfReprisal: 2, respondentCount: 8, themes: ["Supportive management", "Open-door policy valued"] },
    { id: "ci-02", homeId: "oak-house", date: "2025-04-30", source: "staff_survey", opennesScore: 9, trustInManagement: 9, confidenceToChallenge: 9, fearOfReprisal: 1, respondentCount: 8, themes: ["Strong culture of challenge", "Staff feel heard", "Improvements visible"] },
  ];

  return { concerns, policy, courageRecords, awarenessRecords, cultureIndicators };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { concerns, policy, courageRecords, awarenessRecords, cultureIndicators } = getDemoData();
    const referenceDate = new Date().toISOString().split("T")[0];
    const staffIds = ["s-01", "s-02", "s-03", "s-04"];
    const result = generateWhistleblowingIntelligence(
      concerns, policy, courageRecords, awarenessRecords, cultureIndicators,
      staffIds, "oak-house", "2025-01-01", "2025-06-30", referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate whistleblowing intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { concerns, policy, courageRecords, awarenessRecords, cultureIndicators, staffIds, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!policy || !staffIds || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: policy, staffIds, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(concerns) || !Array.isArray(courageRecords) || !Array.isArray(awarenessRecords) || !Array.isArray(cultureIndicators) || !Array.isArray(staffIds)) {
      return NextResponse.json(
        { error: "concerns, courageRecords, awarenessRecords, cultureIndicators, and staffIds must be arrays" },
        { status: 400 },
      );
    }

    const result = generateWhistleblowingIntelligence(
      concerns, policy, courageRecords, awarenessRecords, cultureIndicators,
      staffIds, homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process whistleblowing data", details: String(error) },
      { status: 500 },
    );
  }
}
