// CARA — GET /api/v1/audit-trail
// The field-level before→after change history captured by the audit recorder.
// In-memory + always-on for the demo; durable cs_audit_log backs it when Supabase
// is configured. Gated to roles permitted to view the audit trail.
import { NextRequest, NextResponse } from "next/server";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { getRecordAuditTrail } from "@/lib/audit/audit-recorder";
import { isSupabaseEnabled } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.VIEW_CARA_AUDIT_TRAIL);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType") ?? undefined;
  const entityId = url.searchParams.get("entityId") ?? undefined;
  const homeId = url.searchParams.get("homeId") ?? undefined;
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Math.min(Math.max(parseInt(limitRaw, 10) || 100, 1), 500) : 100;

  const entries = getRecordAuditTrail({ entityType, entityId, homeId, limit });

  return NextResponse.json({
    data: {
      entries,
      count: entries.length,
      durable_persistence: isSupabaseEnabled(),
    },
  });
}
