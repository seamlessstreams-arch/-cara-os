import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.ADD_OVERSIGHT);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const { oversight_note, oversight_by } = body;

  if (!oversight_note || !oversight_by) {
    return NextResponse.json({ error: "oversight_note and oversight_by are required" }, { status: 400 });
  }

  const updated = await dal.incidents.addOversight(id, oversight_note, oversight_by);
  if (!updated) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  // Track time saved (Cara draft used)
  if (body.cara_assisted) {
    // Log Cara-assisted time saving
  }

  return NextResponse.json({ data: updated, message: "Oversight recorded" });
}
