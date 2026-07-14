import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore, db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";
import {
  analyseStayingSafePlan,
  buildStayingSafePlanOverview,
} from "@/lib/staying-safe-plan/staying-safe-plan-engine";
import type { StayingSafePlan, ZonePlan } from "@/lib/staying-safe-plan/types";

export const dynamic = "force-dynamic";

function childrenList() {
  const store = getStore();
  return (store.youngPeople ?? [])
    .filter((yp) => yp.status === "current")
    .map((yp) => ({
      id: yp.id,
      name: yp.preferred_name || yp.first_name || "Child",
    }));
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const zone = (v: unknown): ZonePlan => {
  const z = (v ?? {}) as Partial<ZonePlan>;
  return { signs: str(z.signs), staff_do: str(z.staff_do), staff_dont: str(z.staff_dont) };
};

/**
 * GET /api/v1/staying-safe-plan            → whole-home overview + alerts
 * GET /api/v1/staying-safe-plan?child_id=… → that child's plan + analysis (or null)
 */
export async function GET(req: NextRequest) {
  try {
    const store = getStore();
    const now = new Date().toISOString();
    const childId = new URL(req.url).searchParams.get("child_id");

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;

    if (childId) {
      const plan = db.stayingSafePlans.findByChild(childId);
      return NextResponse.json({
        data: {
          childId,
          childName: getYPName(childId),
          plan: plan ?? null,
          analysis: plan ? analyseStayingSafePlan(plan, now) : null,
        },
      });
    }

    const overview = buildStayingSafePlanOverview({
      now,
      plans: db.stayingSafePlans.findAll(),
      children: childrenList(),
      reflections: store.postIncidentReflections ?? [],
      incidents: store.incidents ?? [],
    });
    return NextResponse.json({ data: overview });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST — create a Staying Safe Plan for a child (one per child). */
export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    if (!body?.child_id) return NextResponse.json({ error: "child_id is required" }, { status: 400 });
    const now = new Date().toISOString();

    const existing = db.stayingSafePlans.findByChild(String(body.child_id));
    if (existing) {
      return NextResponse.json({ data: { plan: existing, analysis: analyseStayingSafePlan(existing, now) } });
    }
    const actor = String(req.headers.get("x-user-id") ?? body.created_by ?? "staff_unknown");

    const plan: StayingSafePlan = {
      id: generateId("ssp"),
      child_id: String(body.child_id),
      home_id: String(body.home_id ?? "home_oak"),
      preferred_name: str(body.preferred_name) || getYPName(String(body.child_id)),
      communication_style: str(body.communication_style),
      theme: str(body.theme) || "blue",
      when_to_use: str(body.when_to_use),
      early_warning_signs: str(body.early_warning_signs),
      green: zone(body.green),
      amber: zone(body.amber),
      red: zone(body.red),
      helpful_words: str(body.helpful_words),
      unhelpful_words: str(body.unhelpful_words),
      calming_tools: str(body.calming_tools),
      trusted_people: str(body.trusted_people),
      safe_spaces: str(body.safe_spaces),
      sensory_needs: str(body.sensory_needs),
      contact_preferences: str(body.contact_preferences),
      repair_recovery: str(body.repair_recovery),
      what_helps_feel_safe_again: str(body.what_helps_feel_safe_again),
      my_choices: str(body.my_choices),
      child_contribution: str(body.child_contribution),
      staff_contribution: str(body.staff_contribution),
      manager_approved: false,
      manager_id: null,
      approved_at: null,
      review_date: body.review_date ? String(body.review_date) : null,
      status: "active",
      created_at: now,
      updated_at: now,
      created_by: actor,
      updated_by: actor,
    };

    db.stayingSafePlans.append(plan);
    return NextResponse.json({ data: { plan, analysis: analyseStayingSafePlan(plan, now) } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH — update a plan (fields, zones, manager approval). */
export async function PATCH(req: NextRequest) {
  try {
    const __jb1 = await readJsonBody(req); if (!__jb1.ok) return __jb1.response; const body = __jb1.data;
    if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const actor = String(req.headers.get("x-user-id") ?? body.updated_by ?? "staff_unknown");
    const now = new Date().toISOString();

    const patch: Partial<StayingSafePlan> = { ...body, updated_by: actor };
    delete (patch as { id?: string }).id;
    if (body.approve === true) {
      patch.manager_approved = true;
      patch.manager_id = actor;
      patch.approved_at = now;
      delete (patch as { approve?: boolean }).approve;
    }

    const updated = db.stayingSafePlans.update(String(body.id), patch);
    if (!updated) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    return NextResponse.json({ data: { plan: updated, analysis: analyseStayingSafePlan(updated, now) } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
