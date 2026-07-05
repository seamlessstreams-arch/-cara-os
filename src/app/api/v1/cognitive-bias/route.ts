// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cognitive Bias Reflection API
//
// POST → compute reflective bias-checks from a record's own facts (a structured
//        signal; the engine never text-mines staff writing or infers intent).
// GET  → the sixteen definitions + a deterministic worked example, so the
//        endpoint is curl-verifiable and the UI has one source of truth.
//
// Pure compute — nothing is persisted, nothing is scored against anyone.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { BIAS_DEFINITIONS, computeBiasReflections } from "@/lib/cognitive-bias/bias-engine";
import { BIAS_CONTEXT_LABELS, type BiasContext, type BiasSignalInput } from "@/lib/cognitive-bias/types";

export const dynamic = "force-dynamic";

const DEMO: BiasSignalInput = {
  context: "management_oversight",
  alternativesConsideredCount: 0,
  childVoiceQuoted: false,
  recentIncidentCount7d: 3,
  concernsRecordedCount: 4,
  strengthsRecordedCount: 0,
};

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    data: {
      definitions: BIAS_DEFINITIONS,
      contexts: BIAS_CONTEXT_LABELS,
      example: { input: DEMO, result: computeBiasReflections(DEMO) },
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;

  const context = typeof body.context === "string" ? body.context : "";
  if (!(context in BIAS_CONTEXT_LABELS)) {
    return NextResponse.json(
      { error: "A valid context is required (e.g. management_oversight, risk_escalation, incident_review)." },
      { status: 422 },
    );
  }

  const signal: BiasSignalInput = {
    context: context as BiasContext,
    alternativesConsideredCount: num(body.alternativesConsideredCount),
    evidenceItemsCited: num(body.evidenceItemsCited),
    childVoiceQuoted: bool(body.childVoiceQuoted),
    decisionWithinDaysOfIncident: num(body.decisionWithinDaysOfIncident),
    recentIncidentCount7d: num(body.recentIncidentCount7d),
    initialAssessmentUnchanged: bool(body.initialAssessmentUnchanged),
    concernsRecordedCount: num(body.concernsRecordedCount),
    strengthsRecordedCount: num(body.strengthsRecordedCount),
    contributorsAgreeing: num(body.contributorsAgreeing),
    dissentRecorded: bool(body.dissentRecorded),
    seniorViewAdoptedWithoutEvidence: bool(body.seniorViewAdoptedWithoutEvidence),
    outcomeKnownAtReview: bool(body.outcomeKnownAtReview),
    riskDowngradedWithoutNewEvidence: bool(body.riskDowngradedWithoutNewEvidence),
    planUnchangedDespiteNoImprovement: bool(body.planUnchangedDespiteNoImprovement),
    justificationFocusedRecording: bool(body.justificationFocusedRecording),
    policyDeviationsRecent: num(body.policyDeviationsRecent),
    staffIncidentExposure30d: num(body.staffIncidentExposure30d),
    reputationCitedAgainstConcern: bool(body.reputationCitedAgainstConcern),
    comparisonCaseCitedWithoutRecords: bool(body.comparisonCaseCitedWithoutRecords),
  };

  return NextResponse.json({ data: computeBiasReflections(signal) });
}

const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const bool = (v: unknown): boolean | undefined => (typeof v === "boolean" ? v : undefined);
