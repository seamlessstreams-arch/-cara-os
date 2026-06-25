// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD RESTRICTIVE PRACTICE INTELLIGENCE API ROUTE
// GET /api/v1/child-restrictive-practice-intelligence?childId=yp_alex
// Per-child engine analysing restraint episodes: frequency, duration,
// compliance, patterns, injuries, debrief rates.
// CHR 2015 Reg 19, 20, 35. SCCIF: "Safety of children."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import {
  computeChildRestrictivePractice,
  type RestraintInput,
} from "@/lib/engines/child-restrictive-practice-intelligence-engine";

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

  // ── Restraints ─────────────────────────────────────────────────────────
  const restraints: RestraintInput[] = ((store.restraints ?? []) as any[])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      id: r.id,
      date: (r.date ?? today).toString().slice(0, 10),
      start_time: r.start_time ?? "12:00",
      end_time: r.end_time ?? "12:00",
      duration_minutes: typeof r.duration === "number" ? r.duration : 0,
      reason: r.reason ?? "unknown",
      restraint_type: r.restraint_type ?? "other",
      staff_involved: Array.isArray(r.staff_involved)
        ? r.staff_involved.map((s: any) => ({
            staff_id: s.staff_id ?? "unknown",
            role: s.role ?? "unknown",
            team_teach_trained: !!s.team_teach_trained,
          }))
        : [],
      de_escalation_attempts: Array.isArray(r.de_escalation_attempts) ? r.de_escalation_attempts : [],
      injuries: Array.isArray(r.injuries)
        ? r.injuries.map((inj: any) => ({
            person: inj.person ?? "unknown",
            description: inj.description ?? inj.injury ?? "",
          }))
        : [],
      child_debriefed: !!r.child_debriefed,
      staff_debriefed: !!r.staff_debriefed,
      body_map_completed: !!r.body_map_completed,
      medical_check_completed: !!r.medical_check_completed,
      review_status: r.review_status ?? "pending",
      reviewed_by: r.reviewed_by ?? "",
      linked_incident_id: r.linked_incident_id ?? null,
      notifications_sent: Array.isArray(r.notifications_sent) ? r.notifications_sent.length : 0,
      has_antecedent: !!r.antecedent,
      has_justification: !!r.justification,
    }));

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildRestrictivePractice({
    today,
    child_id: childId,
    child_name: childName,
    restraints,
  });

  return NextResponse.json({ data: result });
}
