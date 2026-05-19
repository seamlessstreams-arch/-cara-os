// ── GET /api/v1/branding/system ───────────────────────────────────────────────
// Returns Cornerstone system branding. Readable by all authenticated users.
// Writes restricted to super_admin.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  const branding = db.branding.getSystem();
  return NextResponse.json({ data: branding });
}

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Strip non-editable fields
  const { id: _id, created_at: _ca, ...updates } = body;
  void _id; void _ca;

  const updatedBy = (body.updated_by as string | undefined) ?? "system";

  // Audit each changed field
  const current = db.branding.getSystem();
  const editableFields = [
    "logo_url", "icon_url", "wordmark_url", "primary_colour",
    "secondary_colour", "accent_colour", "background_colour",
    "default_footer_text", "support_email",
  ] as const;

  for (const field of editableFields) {
    if (field in updates && updates[field] !== current[field]) {
      db.branding.addAuditEntry({
        changed_by: updatedBy,
        target_type: "system",
        target_id: "cornerstone_system",
        field_name: field,
        previous_value: current[field] ?? null,
        new_value: updates[field] != null ? String(updates[field]) : null,
      });
    }
  }

  const updated = db.branding.updateSystem(updates as Parameters<typeof db.branding.updateSystem>[0]);
  return NextResponse.json({ data: updated });
}
