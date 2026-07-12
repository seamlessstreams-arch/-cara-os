// ── GET/POST/PATCH /api/v1/branding/organisation ───────────────────────────────
// Reads or upserts organisation-level branding.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("organisation_id") ?? "org_oak";
  const branding = db.branding.getOrganisation(orgId);
  return NextResponse.json({ data: branding });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orgId = (body.organisation_id as string | undefined) ?? "org_oak";
  if (!orgId) {
    return NextResponse.json({ error: "organisation_id required" }, { status: 400 });
  }

  const current = db.branding.getOrganisation(orgId);
  const { updated_by: updatedBy, ...data } = body;

  // Audit changed fields
  if (current) {
    for (const [field, newVal] of Object.entries(data)) {
      if (field in current && current[field as keyof typeof current] !== newVal) {
        db.branding.addAuditEntry({
          changed_by: (updatedBy as string) ?? "system",
          target_type: "organisation",
          target_id: orgId,
          field_name: field,
          previous_value: current[field as keyof typeof current] != null
            ? String(current[field as keyof typeof current])
            : null,
          new_value: newVal != null ? String(newVal) : null,
        });
      }
    }
  }

  const updated = db.branding.upsertOrganisation(orgId, data);
  return NextResponse.json({ data: updated });
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
