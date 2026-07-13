// CARA — /api/v1/monitoring-plans (Phase 5 · Module 3)
//
// GET  [?child_id]  — the monitoring board (active plans, most-restrictive first,
//                     overdue reviews, children-without-plan count) or one child's
//                     plans. Read-only, always available.
// POST               — create a plan.   ┐ Both writes are triple-gated:
// PATCH              — update/end one.  ┘ flag (monitoring_plans_write, opt-in
//   default OFF → no-op) → MANAGE_SAFEGUARDING → the validator (a restrictive
//   level is refused without acknowledgement + rationale + the child's views +
//   a review within 28 days). Cara never sets or escalates a level itself.
import { NextRequest, NextResponse } from "next/server";
import { db, getStore } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import {
  computeMonitoringBoard,
  validateMonitoringPlan,
  type MonitoringPlan,
} from "@/lib/monitoring-plans/monitoring-plans-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const store = getStore() as any;
  const childId = req.nextUrl.searchParams.get("child_id");

  if (childId) {
    return NextResponse.json({
      data: { child_id: childId, plans: db.monitoringPlans.findByChild(childId) },
    });
  }

  const board = computeMonitoringBoard({
    plans: db.monitoringPlans.findAll(),
    youngPeople: (store.youngPeople ?? []).map((y: any) => ({
      id: String(y.id),
      first_name: String(y.first_name ?? ""),
      last_name: String(y.last_name ?? ""),
      status: y.status,
    })),
    nowIso: new Date().toISOString(),
  });
  return NextResponse.json({ data: board });
}

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled("monitoring_plans_write")) {
    return NextResponse.json({
      data: { enabled: false, created: false, reason: "monitoring_plans_write is disabled" },
    });
  }
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_SAFEGUARDING);
  if (auth instanceof NextResponse) return auth;

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = (parsed.data ?? {}) as Partial<MonitoringPlan>;

  const validation = validateMonitoringPlan(body);
  if (!validation.valid) {
    return NextResponse.json({ error: "Plan refused", blockers: validation.errors }, { status: 422 });
  }

  const plan = db.monitoringPlans.create({
    ...body,
    check_frequency_minutes: body.observation_level === "intermittent" ? body.check_frequency_minutes ?? null : null,
    status: "active",
    end_date: null,
    created_by: auth.userId,
    updated_by: auth.userId,
  });
  return NextResponse.json({ data: { enabled: true, created: true, plan } }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isFeatureEnabled("monitoring_plans_write")) {
    return NextResponse.json({
      data: { enabled: false, updated: false, reason: "monitoring_plans_write is disabled" },
    });
  }
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_SAFEGUARDING);
  if (auth instanceof NextResponse) return auth;

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = (parsed.data ?? {}) as Partial<MonitoringPlan> & { id?: string; end?: boolean };
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = db.monitoringPlans.findById(body.id);
  if (!existing) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  // Ending a plan is always allowed (it REMOVES a restriction).
  if (body.end) {
    const ended = db.monitoringPlans.update(body.id, {
      status: "ended",
      end_date: new Date().toISOString().slice(0, 10),
      updated_by: auth.userId,
    });
    return NextResponse.json({ data: { enabled: true, updated: true, plan: ended } });
  }

  // Any other change re-validates the WHOLE resulting plan.
  const { id: _id, end: _end, ...changes } = body;
  const candidate = { ...existing, ...changes };
  const validation = validateMonitoringPlan(candidate);
  if (!validation.valid) {
    return NextResponse.json({ error: "Change refused", blockers: validation.errors }, { status: 422 });
  }

  const updated = db.monitoringPlans.update(body.id, { ...changes, updated_by: auth.userId });
  return NextResponse.json({ data: { enabled: true, updated: true, plan: updated } });
}
