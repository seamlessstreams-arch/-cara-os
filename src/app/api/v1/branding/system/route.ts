// ── GET /api/v1/branding/system ───────────────────────────────────────────────
// Returns Cara system branding. Readable by all authenticated users.
// Writes restricted to super_admin.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { getRequestIdentity } from "@/lib/auth-guard";
import { readJsonBody } from "@/lib/http/read-json";

/** Platform/cross-home roles permitted to change SYSTEM branding (activated mode). */
const PLATFORM_ROLES = new Set(["super_admin", "organisation_director", "responsible_individual"]);

export async function GET() {
  const branding = db.branding.getSystem();
  return NextResponse.json({ data: branding });
}

export async function PATCH(req: NextRequest) {
  // Auth: session required in activated mode (401 if none); demo mode = header identity.
  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  // System branding is platform-level — in activated mode restrict writes to platform roles.
  // No-op in demo mode (homeId null), preserving the in-memory demo.
  if (identity.homeId != null && !PLATFORM_ROLES.has(identity.role)) {
    return NextResponse.json(
      { error: "Forbidden", detail: "Only platform administrators can change system branding." },
      { status: 403 },
    );
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;

  // Strip non-editable fields
  const { id: _id, created_at: _ca, ...updates } = body;
  void _id; void _ca;

  // Attribution comes from the resolved identity, never a client-supplied field.
  const updatedBy = identity.userId || "system";

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
