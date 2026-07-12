// ══════════════════════════════════════════════════════════════════════════════
// POST /api/cara/practice-intelligence/lado
//
// Recognises possible concerns about an adult who works with or cares for
// children, and advises a manager/RI review + LADO consideration. Cara NEVER
// decides the outcome and never starts a premature internal investigation.
// Role-gated via cara.analyse_risk. Persists a high-severity practice flag.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { analyzePractice } from "@/lib/cara-practice/cara-practice-engine";
import { db } from "@/lib/db/store";
import { getUserRoleFromRequest, getUserIdFromRequest } from "@/lib/auth-guard";
import { appRoleToCaraRole, checkCaraAccess } from "@/lib/cara/cara-permissions";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { childId?: string; staffId?: string; concern?: string; context?: Record<string, unknown>; homeId?: string; tenantId?: string; persist?: boolean };
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
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
    { permission: "cara.analyse_risk", homeId: body.homeId, childId: body.childId, staffId: body.staffId, isSafeguardingSensitive: true },
  );
  if (!decision.allowed) {
    return NextResponse.json({ error: decision.reason ?? "Not permitted" }, { status: 403 });
  }

  const output = analyzePractice({
    text: body.concern,
    sourceType: "lado_concern",
    assessmentType: "lado",
    childId: body.childId ?? null,
    staffId: body.staffId ?? null,
    homeId: body.homeId ?? null,
    tenantId: body.tenantId ?? null,
  });

  const ladoFlag = output.flags.find((f) => f.flagType === "lado_consideration");
  let flagId: string | null = null;
  if (body.persist !== false && ladoFlag) {
    const rec = db.caraPracticeFlags.create({
      tenant_id: body.tenantId ?? null,
      child_id: body.childId ?? null,
      staff_id: body.staffId ?? null,
      home_id: body.homeId ?? null,
      source_type: "lado_concern",
      source_id: null,
      flag_type: ladoFlag.flagType,
      severity: ladoFlag.severity,
      title: ladoFlag.title,
      description: ladoFlag.description,
      evidence: ladoFlag.evidence.join("; "),
      recommended_action: ladoFlag.recommendedAction,
      requires_manager_review: true,
      requires_ri_review: true,
      resolved: false,
      resolved_at: null,
    });
    flagId = rec.id;
  }

  return NextResponse.json({
    data: {
      flagId,
      ladoConsiderationDetected: Boolean(ladoFlag),
      summary: output.summary,
      flags: output.flags,
      questions: output.questions.filter((q) => q.domain === "lado"),
      recommendations: output.recommendations,
      requiresManagerReview: true,
      requiresRiReview: true,
      guidance:
        "Put the child's welfare first. Consider a LADO consultation before any internal investigation, record the rationale, and notify the registered manager / responsible individual. Cara does not decide the outcome.",
      meta: { engine: "cara-practice-lado", version: "1.0.0", ranBy: userId, role: caraRole },
    },
  });
}
