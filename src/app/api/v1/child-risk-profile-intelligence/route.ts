// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD RISK PROFILE INTELLIGENCE API ROUTE
// GET /api/v1/child-risk-profile-intelligence?childId=yp_alex
// Per-child engine analysing risk assessments across domains,
// risk trajectory, mitigation effectiveness, review compliance.
// CHR 2015 Reg 12, 34, 5. SCCIF: "Safety of children."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import {
  computeChildRiskProfile,
  type RiskAssessmentInput,
} from "@/lib/engines/child-risk-profile-intelligence-engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId is required" }, { status: 400 });
  }

  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Child info ─────────────────────────────────────────────────────────
  const child = (store.youngPeople ?? []).find((yp: any) => yp.id === childId) as any;
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }
  const childName = (child.name ?? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim()) || childId;

  // ── Risk Assessments ───────────────────────────────────────────────────
  const assessments: RiskAssessmentInput[] = ((store.riskAssessments ?? []) as any[])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      id: r.id,
      domain: r.domain ?? "aggression",
      current_level: r.current_level ?? "medium",
      previous_level: r.previous_level ?? "medium",
      trend: r.trend ?? "stable",
      status: r.status ?? "current",
      assessed_date: (r.assessed_date ?? today).toString().slice(0, 10),
      review_date: (r.review_date ?? today).toString().slice(0, 10),
      triggers: Array.isArray(r.triggers) ? r.triggers : [],
      mitigations: Array.isArray(r.mitigations) ? r.mitigations.map((m: any) => ({
        strategy: m.strategy ?? "Unknown",
        responsible: m.responsible ?? "Staff",
        effectiveness: m.effectiveness ?? "not_yet_assessed",
      })) : [],
      has_child_views: !!(r.child_views && r.child_views.trim().length > 0),
      linked_incident_count: Array.isArray(r.linked_incidents) ? r.linked_incidents.length : 0,
    }));

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildRiskProfile({
    today,
    child_id: childId,
    child_name: childName,
    assessments,
  });

  return NextResponse.json({ data: result });
}
