import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore, db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";
import {
  analysePostIncidentReflection,
  buildReflectionOverview,
} from "@/lib/post-incident-reflection/post-incident-reflection-engine";
import { freshStages, type PostIncidentReflection } from "@/lib/post-incident-reflection/types";

export const dynamic = "force-dynamic";

function childrenList() {
  const store = getStore();
  return (store.youngPeople ?? [])
    .filter((yp: { status?: string }) => yp.status === "current")
    .map((yp: { id: string; preferred_name?: string; first_name?: string }) => ({
      id: yp.id,
      name: yp.preferred_name || yp.first_name || "Child",
    }));
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * GET /api/v1/post-incident-reflection                  → home overview (incidents
 *     needing reflection, repeated triggers, alerts, reflections)
 * GET ?child_id=…    → that child's reflections + analysis
 * GET ?incident_id=… → the reflection for that incident (or null) + analysis
 */
export async function GET(req: NextRequest) {
  try {
    const store = getStore();
    const now = new Date().toISOString();
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id");

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;
    const incidentId = searchParams.get("incident_id");

    if (incidentId) {
      const r = db.postIncidentReflections.findByIncident(incidentId);
      return NextResponse.json({
        data: r ? { reflection: r, analysis: analysePostIncidentReflection(r, now) } : null,
      });
    }
    if (childId) {
      const reviews = db.postIncidentReflections.findByChild(childId);
      return NextResponse.json({
        data: {
          childId,
          childName: getYPName(childId),
          reflections: reviews
            .map((r) => ({ reflection: r, analysis: analysePostIncidentReflection(r, now) }))
            .sort((a, b) => b.reflection.incident_date.localeCompare(a.reflection.incident_date)),
        },
      });
    }

    const overview = buildReflectionOverview({
      now,
      reflections: db.postIncidentReflections.findAll(),
      incidents: store.incidents ?? [],
      children: childrenList(),
    });
    return NextResponse.json({ data: overview });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/v1/post-incident-reflection — start a reflection for an incident.
 * Copies the incident's details where it can find them; seeds the 10-stage
 * workflow. Mutates only the in-memory store.
 */
export async function POST(req: NextRequest) {
  try {
    const store = getStore();
    const body = await req.json();
    if (!body?.incident_id) {
      return NextResponse.json({ error: "incident_id is required" }, { status: 400 });
    }
    const existing = db.postIncidentReflections.findByIncident(String(body.incident_id));
    if (existing) {
      return NextResponse.json({ data: { reflection: existing, analysis: analysePostIncidentReflection(existing, new Date().toISOString()) } });
    }

    const incident = (store.incidents ?? []).find((i: { id: string }) => i.id === String(body.incident_id)) as
      | { child_id?: string; date?: string; severity?: string; location?: string | null; description?: string }
      | undefined;
    const now = new Date().toISOString();
    const actor = String(req.headers.get("x-user-id") ?? body.created_by ?? "staff_unknown");
    const childId = String(body.child_id ?? incident?.child_id ?? "");
    if (!childId) {
      return NextResponse.json({ error: "child_id is required (incident not found to derive it)" }, { status: 400 });
    }

    const reflection: PostIncidentReflection = {
      id: generateId("pir"),
      incident_id: String(body.incident_id),
      child_id: childId,
      home_id: String(body.home_id ?? "home_oak"),
      incident_date: str(body.incident_date) || incident?.date || now.slice(0, 10),
      severity: str(body.severity) || String(incident?.severity ?? "moderate"),
      what_happened: str(body.what_happened) || str(incident?.description),
      location: str(body.location) || str(incident?.location),
      who_involved: str(body.who_involved),
      impact_on_child: str(body.impact_on_child),
      impact_on_others: str(body.impact_on_others),
      impact_on_staff: str(body.impact_on_staff),
      impact_on_environment: str(body.impact_on_environment),
      likely_triggers: str(body.likely_triggers),
      contributing_factors: str(body.contributing_factors),
      communication_factors: str(body.communication_factors),
      sensory_environmental_factors: str(body.sensory_environmental_factors),
      staff_response: str(body.staff_response),
      response_helped: body.response_helped ?? "unknown",
      response_escalated: body.response_escalated ?? "unknown",
      what_went_well: str(body.what_went_well),
      what_could_be_different: str(body.what_could_be_different),
      child_view: str(body.child_view),
      staff_reflection: str(body.staff_reflection),
      manager_reflection: str(body.manager_reflection),
      learning_points: str(body.learning_points),
      actions: Array.isArray(body.actions) ? body.actions : [],
      support_needed: str(body.support_needed),
      staying_safe_plan_review: !!body.staying_safe_plan_review,
      risk_assessment_review: !!body.risk_assessment_review,
      behaviour_support_review: !!body.behaviour_support_review,
      relationship_map_review: !!body.relationship_map_review,
      restrictive_practice_review: !!body.restrictive_practice_review,
      staff_debrief_done: body.staff_debrief_done ?? "unknown",
      child_debrief_done: body.child_debrief_done ?? "unknown",
      stages: freshStages(now),
      status: "in_progress",
      manager_id: null,
      signed_off_by: null,
      signed_off_at: null,
      created_at: now,
      updated_at: now,
      created_by: actor,
      updated_by: actor,
    };

    db.postIncidentReflections.append(reflection);
    return NextResponse.json(
      { data: { reflection, analysis: analysePostIncidentReflection(reflection, now) } },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/post-incident-reflection — update a reflection (fields, stages,
 * manager comments, sign-off). Sign-off is audit-stamped.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const actor = String(req.headers.get("x-user-id") ?? body.updated_by ?? "staff_unknown");
    const now = new Date().toISOString();

    const patch: Partial<PostIncidentReflection> = { ...body, updated_by: actor };
    delete (patch as { id?: string }).id;
    if (body.sign_off === true) {
      patch.status = "signed_off";
      patch.signed_off_by = actor;
      patch.signed_off_at = now;
      delete (patch as { sign_off?: boolean }).sign_off;
    }

    const updated = db.postIncidentReflections.update(String(body.id), patch);
    if (!updated) return NextResponse.json({ error: "Reflection not found" }, { status: 404 });
    return NextResponse.json({ data: { reflection: updated, analysis: analysePostIncidentReflection(updated, now) } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
