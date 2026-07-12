// ══════════════════════════════════════════════════════════════════════════════
// CARA — Management Oversight (workflow-based) API
//
// GET  → returns a deterministic worked example so the engine is curl-verifiable
//        in any environment, INCLUDING production with no AI key.
// POST → generates management oversight for a real workflow payload.
//
// Guarded by ADD_OVERSIGHT (managers + team leaders). No external AI calls:
// generation is fully deterministic. Where deterministic rules are insufficient
// the result simply RECOMMENDS enhanced drafting (apiCallRecommended) — it never
// performs it here.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { generateManagementOversight } from "@/lib/oversight/management-oversight-engine";
import { OVERSIGHT_DISCLAIMER, type OversightInput } from "@/lib/oversight/types";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

// A representative "mostly complete, one gap" physical-intervention workflow.
// Deterministic — no timestamps — so the GET output is stable and verifiable.
const DEMO_INPUT: OversightInput = {
  oversightMode: "both",
  recordType: "physical_intervention",
  childName: "Jordan",
  childAge: 14,
  reviewedByRole: "registered_manager",
  recordDate: "2026-06-10",
  therapeuticModel: "PACE",
  childAddressedTone: "older_child",
  summary:
    "Jordan became distressed after a contact phone call; a brief single-staff guide was used to keep Jordan and a peer safe.",
  existingRiskLevel: "medium",
  restraintUsed: true,
  injuriesRecordedOrRuledOut: true,
  chronologyClear: true,
  staffActionsRecorded: true,
  childVoiceCaptured: true,
  childPresentationRecorded: true,
  responsiblePersonRecorded: true,
  timescaleRecorded: true,
  antecedentsIncluded: true,
  childContext: {
    livedExperienceSummary: "early experiences of unpredictability; settles with routine and a trusted adult",
    knownTriggers: ["unexpected changes to contact", "raised voices"],
    knownCalmingStrategies: ["time in the sensory space", "a walk with a key adult"],
  },
  recentContext: { recentPhysicalInterventionsCount: 1, recentContactImpact: "contact calls have been unsettling recently" },
  patternContext: { repeatedThemes: ["distress around contact"], patternConfidence: "medium", patternDirection: "stable" },
  practiceResponseContext: {
    plannedStrategiesUsed: ["offered the sensory space", "lowered voices and reduced demands"],
    staffReflectionCompleted: true,
  },
  planAdherenceContext: {
    guidingDocumentChecks: [
      { documentType: "behaviour_support_plan", wasFollowed: "followed" },
      { documentType: "keeping_me_safe_plan", wasFollowed: "followed" },
    ],
  },
  proportionalityAssessment: {
    leastRestrictiveOptionConsidered: true,
    interventionNecessary: true,
    interventionProportionate: true,
    dignityMaintained: true,
    rationaleRecorded: true,
  },
  workflowCompletionContext: {
    workflowName: "Physical intervention follow-up",
    workflowSteps: [
      { stepName: "Physical intervention record", required: true, completed: true },
      { stepName: "Body map / injury check", required: true, completed: true },
    ],
    associatedPaperwork: [
      { paperworkType: "physical_intervention_record", required: true, status: "complete" },
      { paperworkType: "body_map", required: true, status: "complete" },
    ],
    staffDebrief: {
      required: true,
      status: "required_completed",
      practiceLearning: ["spotting early signs of distress after contact calls"],
    },
    // The single gap in an otherwise complete workflow.
    childDebrief: { required: true, status: "required_not_completed" },
    actionTrackerUpdated: true,
    allActionsAssigned: true,
    allActionsHaveTimescales: true,
  },
  qualityAssuranceRouting: { includeInReg44Summary: true, includeInTeamMeeting: true },
};

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.ADD_OVERSIGHT);
  if (auth instanceof NextResponse) return auth;
  try {
    const result = generateManagementOversight(DEMO_INPUT);
    return NextResponse.json({
      data: {
        example: true,
        input: DEMO_INPUT,
        result,
        disclaimer: OVERSIGHT_DISCLAIMER,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate example management oversight", details: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.ADD_OVERSIGHT);
  if (auth instanceof NextResponse) return auth;

  let body: Partial<OversightInput>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Partial<OversightInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "A workflow oversight payload is required" }, { status: 400 });
  }

  // Sensible defaults so a thin payload still produces a useful, safe result.
  const input: OversightInput = {
    oversightMode: body.oversightMode ?? "both",
    recordType: body.recordType ?? "incident",
    reviewedByRole: body.reviewedByRole ?? auth.role,
    ...body,
  };

  try {
    const result = generateManagementOversight(input);
    return NextResponse.json({ data: { result, disclaimer: OVERSIGHT_DISCLAIMER } });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate management oversight", details: String(error) },
      { status: 500 },
    );
  }
}
