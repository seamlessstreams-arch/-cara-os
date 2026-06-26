import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = intelligenceDb.contactArrangements.findById(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.EDIT_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const { id }  = await params;
  const body    = await req.json();
  const updated = intelligenceDb.contactArrangements.patch(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
