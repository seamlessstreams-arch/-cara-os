// ══════════════════════════════════════════════════════════════════════════════
// GET /api/cara/practice-intelligence/dashboard?homeId=&childId=
//
// Manager / RI / director practice-intelligence dashboard: open flags, gap
// heatmap, practice-drift warnings, protective-factor weaknesses, relationship-
// depth map, threshold watchlist, staff wellbeing (role-restricted) and the
// safeguarding culture radar. Role-gated via cara.use.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { buildPracticeDashboard } from "@/lib/cara-practice/cara-dashboard";
import { db } from "@/lib/db/store";
import { getUserRoleFromRequest, getUserIdFromRequest } from "@/lib/auth-guard";
import { appRoleToCaraRole, checkCaraAccess, caraCan } from "@/lib/cara/cara-permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const homeId = url.searchParams.get("homeId") ?? undefined;
  const childId = url.searchParams.get("childId") ?? undefined;

  const appRole = getUserRoleFromRequest(req);
  const userId = getUserIdFromRequest(req);
  const caraRole = appRoleToCaraRole(appRole);
  const decision = checkCaraAccess(
    { userId, role: caraRole, homeId, staffSelfId: userId },
    { permission: "cara.use", homeId },
  );
  if (!decision.allowed) {
    return NextResponse.json({ error: decision.reason ?? "Not permitted" }, { status: 403 });
  }

  const byChild = <T extends { child_id?: string | null }>(rows: T[]) => (childId ? rows.filter((r) => r.child_id === childId) : rows);

  const flags = byChild(db.caraPracticeFlags.findAll(homeId));
  const thresholdConsultations = byChild(db.caraThresholdConsultations.findAll());
  const developmentalGaps = byChild(db.caraDevelopmentalGaps.findAll());
  const protectiveFactorReviews = byChild(db.caraProtectiveFactorReviews.findAll());
  const relationshipDepthReviews = byChild(db.caraRelationshipDepthReviews.findAll());
  const assessments = byChild(db.caraPracticeAssessments.findAll(homeId));
  const wellbeingSignals = db.caraStaffWellbeingSignals.findAll(homeId);

  const dashboard = buildPracticeDashboard({
    flags,
    thresholdConsultations,
    wellbeingSignals,
    developmentalGaps,
    protectiveFactorReviews,
    relationshipDepthReviews,
    assessments,
    canSeeWellbeing: caraCan(caraRole, "cara.view_sensitive_context"),
    viewerStaffId: userId,
  });

  return NextResponse.json({
    data: { ...dashboard, meta: { engine: "cara-practice-dashboard", version: "1.0.0", homeId: homeId ?? null, childId: childId ?? null, role: caraRole } },
  });
}
