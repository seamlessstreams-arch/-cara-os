// ══════════════════════════════════════════════════════════════════════════════
// POST /api/cara/practice-intelligence/analyse
//
// Runs the deterministic Cara Practice Intelligence engine over a piece of
// professional text and (when a sourceId is supplied) persists the assessment +
// flags as the audit trail. Role-gated via the existing Cara permission model.
//
// Cara advises — the manager decides. No statutory decision is made here.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { analyzePractice, CARA_GUIDANCE_RULES } from "@/lib/cara-practice/cara-practice-engine";
import { db } from "@/lib/db/store";
import { getUserRoleFromRequest, getUserIdFromRequest } from "@/lib/auth-guard";
import { appRoleToCaraRole, checkCaraAccess } from "@/lib/cara/cara-permissions";
import type { CaraPracticeInput, CaraFlag } from "@/lib/cara-practice/types";

export const dynamic = "force-dynamic";

/** Seed the guidance-rule library on first use (idempotent). */
function ensureGuidanceRulesSeeded(): void {
  if (db.caraGuidanceRules.findAll().length > 0) return;
  for (const rule of CARA_GUIDANCE_RULES) db.caraGuidanceRules.create(rule);
}

export async function POST(req: Request) {
  let body: Partial<CaraPracticeInput> & { persist?: boolean; createdBy?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Validation ──────────────────────────────────────────────────────────
  if (!body || typeof body.text !== "string" || body.text.trim().length === 0) {
    return NextResponse.json({ error: "`text` is required" }, { status: 400 });
  }
  if (!body.sourceType) {
    return NextResponse.json({ error: "`sourceType` is required" }, { status: 400 });
  }

  // ── Role gate ───────────────────────────────────────────────────────────
  const appRole = getUserRoleFromRequest(req);
  const userId = getUserIdFromRequest(req);
  const caraRole = appRoleToCaraRole(appRole);
  const decision = checkCaraAccess(
    { userId, role: caraRole, homeId: body.homeId ?? undefined, staffSelfId: userId },
    {
      permission: "cara.use",
      homeId: body.homeId ?? undefined,
      childId: body.childId ?? undefined,
      staffId: body.staffId ?? undefined,
      isSafeguardingSensitive: body.sourceType === "safeguarding_concern" || body.sourceType === "lado_concern",
    },
  );
  if (!decision.allowed) {
    return NextResponse.json({ error: decision.reason ?? "Not permitted" }, { status: 403 });
  }

  ensureGuidanceRulesSeeded();

  // ── Run the engine ──────────────────────────────────────────────────────
  const output = analyzePractice({
    text: body.text,
    sourceType: body.sourceType,
    sourceId: body.sourceId ?? null,
    assessmentType: body.assessmentType,
    childId: body.childId ?? null,
    staffId: body.staffId ?? null,
    homeId: body.homeId ?? null,
    tenantId: body.tenantId ?? null,
    context: body.context,
    today: body.today,
  });

  // ── Persist (audit trail) when a sourceId is supplied or persist requested ──
  let assessmentId: string | null = null;
  const shouldPersist = body.persist !== false && (body.sourceId != null || body.persist === true);
  if (shouldPersist) {
    const assessment = db.caraPracticeAssessments.create({
      tenant_id: body.tenantId ?? null,
      child_id: body.childId ?? null,
      staff_id: body.staffId ?? null,
      home_id: body.homeId ?? null,
      source_type: body.sourceType,
      source_id: body.sourceId ?? null,
      assessment_type: body.assessmentType ?? "practice_quality",
      status: "open",
      created_by: body.createdBy ?? userId,
      developmental_gap_score: output.scores.developmentalGap,
      child_lived_experience_score: output.scores.livedExperience,
      protective_factor_score: output.scores.protectiveFactors,
      relationship_depth_score: output.scores.relationshipDepth,
      safeguarding_threshold_score: output.scores.safeguardingThreshold,
      supervision_quality_score: output.scores.overall,
      workforce_wellbeing_score: output.scores.staffWellbeing,
      overall_practice_quality_score: output.scores.overall,
      summary: output.summary,
      aria_advice: output.recommendations,
      aria_flags: output.flags,
      aria_recommendations: output.recommendations,
      aria_questions: output.questions,
      aria_draft_output: null,
      reviewer_id: null,
      reviewed_at: null,
      manager_decision: null,
      manager_rationale: null,
    });
    assessmentId = assessment.id;

    // Persist each flag so dashboards / watchlists can surface them.
    for (const f of output.flags as CaraFlag[]) {
      db.caraPracticeFlags.create({
        tenant_id: body.tenantId ?? null,
        child_id: body.childId ?? null,
        staff_id: body.staffId ?? null,
        home_id: body.homeId ?? null,
        source_type: body.sourceType,
        source_id: body.sourceId ?? null,
        flag_type: f.flagType,
        severity: f.severity,
        title: f.title,
        description: f.description,
        evidence: f.evidence.join("; "),
        recommended_action: f.recommendedAction,
        requires_manager_review: f.requiresManagerReview,
        requires_ri_review: f.requiresRiReview,
        resolved: false,
        resolved_at: null,
      });
    }
  }

  return NextResponse.json({
    data: {
      ...output,
      assessmentId,
      persisted: shouldPersist,
      meta: {
        engine: "cara-practice-intelligence",
        version: "1.0.0",
        ranBy: userId,
        role: caraRole,
      },
    },
  });
}
