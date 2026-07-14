import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore, db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";
import {
  analyseChildRelationships,
  buildRelationshipsOverview,
} from "@/lib/protective-relationships/protective-relationships-engine";
import type { RelationshipEntry } from "@/lib/protective-relationships/types";

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

/**
 * GET /api/v1/protective-relationships            → whole-home overview + alerts
 * GET /api/v1/protective-relationships?child_id=… → that child's map + analysis
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
      const entries = db.relationshipEntries.findByChild(childId);
      const analysis = analyseChildRelationships(
        entries,
        (store.incidents ?? []).filter((i: { child_id: string }) => i.child_id === childId),
        (store.missingEpisodes ?? []).filter((m: { child_id: string }) => m.child_id === childId),
        now,
      );
      return NextResponse.json({ data: { childId, childName: getYPName(childId), entries, analysis } });
    }

    const overview = buildRelationshipsOverview({
      now,
      entries: db.relationshipEntries.findAll(),
      children: childrenList(),
      reflections: store.postIncidentReflections ?? [],
      incidents: store.incidents ?? [],
      missing: store.missingEpisodes ?? [],
    });
    return NextResponse.json({ data: overview });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST — add a relationship to a child's map. */
export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    if (!body?.child_id || !str(body.name).trim()) {
      return NextResponse.json({ error: "child_id and name are required" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const actor = String(req.headers.get("x-user-id") ?? body.created_by ?? "staff_unknown");

    const e: RelationshipEntry = {
      id: generateId("rel"),
      child_id: String(body.child_id),
      home_id: String(body.home_id ?? "home_oak"),
      name: str(body.name),
      relationship_to_child: str(body.relationship_to_child),
      category: body.category ?? "other",
      rating: body.rating ?? "neutral",
      child_view: str(body.child_view),
      staff_view: str(body.staff_view),
      manager_view: str(body.manager_view),
      known_concerns: str(body.known_concerns),
      known_strengths: str(body.known_strengths),
      contact_arrangements: str(body.contact_arrangements),
      restrictions: str(body.restrictions),
      linked_record_ids: Array.isArray(body.linked_record_ids) ? body.linked_record_ids.map(String) : [],
      review_date: body.review_date ? String(body.review_date) : null,
      status: "active",
      created_at: now,
      updated_at: now,
      created_by: actor,
      updated_by: actor,
    };
    db.relationshipEntries.append(e);
    return NextResponse.json({ data: e }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH — update a relationship entry. */
export async function PATCH(req: NextRequest) {
  try {
    const __jb1 = await readJsonBody(req); if (!__jb1.ok) return __jb1.response; const body = __jb1.data;
    if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const actor = String(req.headers.get("x-user-id") ?? body.updated_by ?? "staff_unknown");
    const patch: Partial<RelationshipEntry> = { ...body, updated_by: actor };
    delete (patch as { id?: string }).id;
    const updated = db.relationshipEntries.update(String(body.id), patch);
    if (!updated) return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
