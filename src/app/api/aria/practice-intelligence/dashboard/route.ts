// ══════════════════════════════════════════════════════════════════════════════
// GET /api/aria/practice-intelligence/dashboard?homeId=&childId=
//
// Manager / RI / director practice-intelligence dashboard: open flags, gap
// heatmap, practice-drift warnings, protective-factor weaknesses, relationship-
// depth map, threshold watchlist, staff wellbeing (role-restricted) and the
// safeguarding culture radar. Role-gated via aria.use.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { buildPracticeDashboard } from "@/lib/aria-practice/aria-dashboard";
import { db } from "@/lib/db/store";
import { getUserRoleFromRequest, getUserIdFromRequest } from "@/lib/auth-guard";
import { appRoleToAriaRole, checkAriaAccess, ariaCan } from "@/lib/aria/aria-permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const homeId = url.searchParams.get("homeId") ?? undefined;
  const childId = url.searchParams.get("childId") ?? undefined;

  const appRole = getUserRoleFromRequest(req);
  const userId = getUserIdFromRequest(req);
  const ariaRole = appRoleToAriaRole(appRole);
  const decision = checkAriaAccess(
    { userId, role: ariaRole, homeId, staffSelfId: userId },
    { permission: "aria.use", homeId },
  );
  if (!decision.allowed) {
    return NextResponse.json({ error: decision.reason ?? "Not permitted" }, { status: 403 });
  }

  const byChild = <T extends { child_id?: string | null }>(rows: T[]) => (childId ? rows.filter((r) => r.child_id === childId) : rows);

  const flags = byChild(db.ariaPracticeFlags.findAll(homeId));
  const thresholdConsultations = byChild(db.ariaThresholdConsultations.findAll());
  const developmentalGaps = byChild(db.ariaDevelopmentalGaps.findAll());
  const protectiveFactorReviews = byChild(db.ariaProtectiveFactorReviews.findAll());
  const relationshipDepthReviews = byChild(db.ariaRelationshipDepthReviews.findAll());
  const assessments = byChild(db.ariaPracticeAssessments.findAll(homeId));
  const wellbeingSignals = db.ariaStaffWellbeingSignals.findAll(homeId);

  const dashboard = buildPracticeDashboard({
    flags,
    thresholdConsultations,
    wellbeingSignals,
    developmentalGaps,
    protectiveFactorReviews,
    relationshipDepthReviews,
    assessments,
    canSeeWellbeing: ariaCan(ariaRole, "aria.view_sensitive_context"),
    viewerStaffId: userId,
  });

  return NextResponse.json({
    data: { ...dashboard, meta: { engine: "aria-practice-dashboard", version: "1.0.0", homeId: homeId ?? null, childId: childId ?? null, role: ariaRole } },
  });
}
