// ══════════════════════════════════════════════════════════════════════════════
// CARA — GET /api/v1/abac-divergence
//
// What would flipping ABAC to enforcing actually deny? This answers it from
// recorded evidence instead of intuition: every advisory-vs-enforced
// disagreement, split into real-context evidence and unknown-actor noise.
//
// Read-only. Management-only (it names staff who would be denied). Never
// asserts the flip is safe — absence of divergence is not proof.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { summariseAbacDivergence } from "@/lib/permissions/abac-divergence";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_STAFF);
  if (auth instanceof NextResponse) return auth;

  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "500");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 1000) : 500;

  const summary = summariseAbacDivergence(limit);
  return NextResponse.json({
    data: summary,
    meta: {
      mode: "advisory",
      note:
        "ABAC runs beside the enforced flat check and never blocks. These are the accesses an enforcing flip would refuse.",
      source: "in-memory audit trail (per serverless instance) + durable cs_audit_log when Supabase is configured",
    },
  });
}
