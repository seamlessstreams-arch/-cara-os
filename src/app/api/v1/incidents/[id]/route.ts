import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = requirePermission(req, PERMISSIONS.VIEW_INCIDENTS);
  if (auth instanceof NextResponse) return auth;

  const incident = db.incidents.findById(id);
  if (!incident) return NextResponse.json({ error: "Incident not found" }, { status: 404 });

  return NextResponse.json({ data: incident });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = requirePermission(req, PERMISSIONS.MANAGE_INCIDENTS);
  if (auth instanceof NextResponse) return auth;

  const incident = db.incidents.findById(id);
  if (!incident) return NextResponse.json({ error: "Incident not found" }, { status: 404 });

  const body = await req.json();
  const { action, ...rest } = body;

  if (action === "oversight") {
    const updated = db.incidents.addOversight(
      id,
      rest.oversight_note ?? "",
      auth.userId
    );
    return NextResponse.json({ data: updated });
  }

  // General update — strip audit fields
  const { id: _id, created_at: _c, created_by: _cb, reference: _ref, ...safe } = rest;
  const idx = db.incidents.findAll().findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = { ...incident, ...safe, updated_at: new Date().toISOString(), updated_by: auth.userId };
  db.incidents.findAll()[idx] = updated as typeof incident;
  return NextResponse.json({ data: updated });
}
