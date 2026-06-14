// ══════════════════════════════════════════════════════════════════════════════
// API: /api/hr/suspension-decision
//
// POST /api/hr/suspension-decision  — analyse a suspension decision
//
// This endpoint is analyse-only by design. The decision is recorded as a
// case action on the parent HR case via /api/hr/cases (PATCH) once the
// manager is ready to commit. The suspension letter itself goes through
// /api/hr/letters and the HR Process Guardian.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  analyseSuspensionDecision,
  emptyRiskFactors,
  type SuspensionDecisionInput,
  type SuspensionDecisionAnalysis,
} from "@/lib/hr/suspensionDecision";
import { checkHrAccess, type HrRole } from "@/lib/hr/permissions";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    actorUserId,
    actorRole,
    homeId,
    staffId,
    riskFactors,
    ...rest
  } = body as Partial<SuspensionDecisionInput> & {
    actorUserId?: string;
    actorRole?: HrRole;
  };

  if (!actorUserId || !actorRole) {
    return NextResponse.json({ error: "actorUserId and actorRole are required" }, { status: 400 });
  }
  if (!staffId) {
    return NextResponse.json({ error: "staffId is required" }, { status: 400 });
  }

  // Suspension is significant. Require a role that has case.update.
  const access = checkHrAccess(
    { role: actorRole, userId: actorUserId, homeId },
    { action: "case.update", homeId, staffId },
  );
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  const input: SuspensionDecisionInput = {
    homeId,
    staffId,
    concernSummary: typeof rest.concernSummary === "string" ? rest.concernSummary : "",
    riskFactors: (riskFactors as SuspensionDecisionInput["riskFactors"]) ?? emptyRiskFactors(),
    alternativesConsidered: Array.isArray(rest.alternativesConsidered) ? rest.alternativesConsidered : [],
    alternativeRejectionRationale:
      typeof rest.alternativeRejectionRationale === "string" ? rest.alternativeRejectionRationale : "",
    hrAdviceSought: !!rest.hrAdviceSought,
    hrAdviceSummary: rest.hrAdviceSummary,
    riAdviceSought: !!rest.riAdviceSought,
    riAdviceSummary: rest.riAdviceSummary,
    ladoAdviceSought: !!rest.ladoAdviceSought,
    ladoAdviceSummary: rest.ladoAdviceSummary,
    ladoAdviceDate: rest.ladoAdviceDate,
    policeOrSocialWorkerInvolved: !!rest.policeOrSocialWorkerInvolved,
    policeOrSocialWorkerNotes: rest.policeOrSocialWorkerNotes,
    welfareSinglePointOfContact:
      typeof rest.welfareSinglePointOfContact === "string" ? rest.welfareSinglePointOfContact : "",
    welfareSupportOffered: Array.isArray(rest.welfareSupportOffered) ? rest.welfareSupportOffered : [],
    welfareReviewIntervalDays:
      typeof rest.welfareReviewIntervalDays === "number" ? rest.welfareReviewIntervalDays : 14,
    firstReviewDate: typeof rest.firstReviewDate === "string" ? rest.firstReviewDate : "",
    proposedDecision:
      rest.proposedDecision === "do_not_suspend" ||
      rest.proposedDecision === "alternative_arrangement" ||
      rest.proposedDecision === "suspend"
        ? rest.proposedDecision
        : "suspend",
    alternativeArrangementDescription: rest.alternativeArrangementDescription,
    effectiveFromDate: rest.effectiveFromDate,
    decisionMakerUserId: actorUserId,
    decisionMakerRole: actorRole,
    caseId: rest.caseId,
  };

  let analysis: SuspensionDecisionAnalysis;
  try {
    analysis = analyseSuspensionDecision(input);
  } catch (err) {
    return NextResponse.json(
      { error: "Engine error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { analysis, caraLabel: analysis.caraLabel } });
}
