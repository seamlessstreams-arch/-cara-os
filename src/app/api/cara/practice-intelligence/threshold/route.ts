// ══════════════════════════════════════════════════════════════════════════════
// POST /api/cara/practice-intelligence/threshold
//
// Supports a manager's safeguarding-threshold consultation. Cara structures the
// thinking and drafts the formulation — it does NOT make the statutory decision.
// Role-gated via cara.analyse_risk. Persists a consultation record (audit trail).
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { analyzePractice } from "@/lib/cara-practice/cara-practice-engine";
import { db } from "@/lib/db/store";
import { getUserRoleFromRequest, getUserIdFromRequest } from "@/lib/auth-guard";
import { appRoleToCaraRole, checkCaraAccess } from "@/lib/cara/cara-permissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { childId?: string; concern?: string; context?: Record<string, unknown>; homeId?: string; tenantId?: string; persist?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body?.concern !== "string" || body.concern.trim().length === 0) {
    return NextResponse.json({ error: "`concern` is required" }, { status: 400 });
  }

  const appRole = getUserRoleFromRequest(req);
  const userId = getUserIdFromRequest(req);
  const caraRole = appRoleToCaraRole(appRole);
  const decision = checkCaraAccess(
    { userId, role: caraRole, homeId: body.homeId, staffSelfId: userId },
    { permission: "cara.analyse_risk", homeId: body.homeId, childId: body.childId, isSafeguardingSensitive: true },
  );
  if (!decision.allowed) {
    return NextResponse.json({ error: decision.reason ?? "Not permitted" }, { status: 403 });
  }

  const output = analyzePractice({
    text: body.concern,
    sourceType: "safeguarding_concern",
    assessmentType: "threshold",
    childId: body.childId ?? null,
    homeId: body.homeId ?? null,
    tenantId: body.tenantId ?? null,
  });

  const t = output.threshold;
  let consultationId: string | null = null;
  if (body.persist !== false && body.childId) {
    const rec = db.caraThresholdConsultations.create({
      tenant_id: body.tenantId ?? null,
      child_id: body.childId,
      concern_type: "safeguarding",
      source_type: "safeguarding_concern",
      source_id: null,
      child_lived_experience: t?.childLivedExperience ?? "",
      evidence_and_harm_analysis: t?.evidenceAndHarm ?? "",
      family_functioning_parental_capacity: "<manager to complete — parental capacity and family functioning>",
      threshold_and_escalation_analysis: t?.managerSummary ?? output.summary,
      decision_rationale: "<manager to complete — Cara does not make the statutory decision>",
      recommended_next_step: output.recommendations.map((r) => r.title).join("; ") || "Complete a threshold consultation",
      reasonable_cause_to_suspect_significant_harm: null,
      strategy_discussion_recommended: t?.strategyDiscussionRecommended ?? false,
      lado_consultation_recommended: t?.ladoConsultationRecommended ?? false,
      emergency_action_recommended: t?.emergencyActionRecommended ?? false,
      cara_summary: output.summary,
      manager_decision: null,
      manager_rationale: null,
      created_by: userId,
    });
    consultationId = rec.id;
  }

  return NextResponse.json({
    data: {
      consultationId,
      summary: output.summary,
      threshold: output.threshold,
      flags: output.flags,
      questions: output.questions.filter((q) => q.domain === "threshold" || q.domain === "livers"),
      recommendations: output.recommendations,
      requiresManagerReview: output.requiresManagerReview,
      requiresRiReview: output.requiresRiReview,
      highestSeverity: output.highestSeverity,
      note: "Cara structures the consultation and drafts the formulation. The manager makes the statutory decision.",
      meta: { engine: "cara-practice-threshold", version: "1.0.0", ranBy: userId, role: caraRole },
    },
  });
}
