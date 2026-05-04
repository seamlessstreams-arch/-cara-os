import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = requirePermission(req, PERMISSIONS.VIEW_SUPERVISION);
  if (auth instanceof NextResponse) return auth;

  const supervision = db.supervisions.findById(id);
  if (!supervision) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: supervision });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = requirePermission(req, PERMISSIONS.MANAGE_SUPERVISION);
  if (auth instanceof NextResponse) return auth;

  const supervision = db.supervisions.findById(id);
  if (!supervision) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { action, ...rest } = body;

  if (action === "complete") {
    const updated = db.supervisions.complete(id, { ...rest, updated_by: auth.userId });
    return NextResponse.json({ data: updated });
  }

  // General update — strip protected audit fields
  const { id: _id, created_at: _c, created_by: _cb, ...safe } = rest;
  const updated = db.supervisions.update(id, { ...safe, updated_by: auth.userId });
  return NextResponse.json({ data: updated });
}
