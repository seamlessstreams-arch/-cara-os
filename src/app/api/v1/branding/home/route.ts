// ── GET/POST/PATCH /api/v1/branding/home ─────────────────────────────────────
// Reads or upserts home-level branding.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? "home_oak";
  const branding = db.branding.getHome(homeId);
  return NextResponse.json({ data: branding });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const homeId = (body.home_id as string | undefined) ?? "home_oak";
  const orgId = (body.organisation_id as string | undefined) ?? "org_oak";
  if (!homeId) {
    return NextResponse.json({ error: "home_id required" }, { status: 400 });
  }

  const current = db.branding.getHome(homeId);
  const { updated_by: updatedBy, ...data } = body;

  if (current) {
    for (const [field, newVal] of Object.entries(data)) {
      if (field in current && current[field as keyof typeof current] !== newVal) {
        db.branding.addAuditEntry({
          changed_by: (updatedBy as string) ?? "system",
          target_type: "home",
          target_id: homeId,
          field_name: field,
          previous_value: current[field as keyof typeof current] != null
            ? String(current[field as keyof typeof current])
            : null,
          new_value: newVal != null ? String(newVal) : null,
        });
      }
    }
  }

  const updated = db.branding.upsertHome(homeId, orgId, data);
  return NextResponse.json({ data: updated });
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
