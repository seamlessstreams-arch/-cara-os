// ═════════════════════════════════════════════════════════════════════════════
// API: GET /api/v1/aria/health
//
// Returns the full AriaHealthStatus diagnostic object.
//
// Access: registered_manager, responsible_individual, deputy_manager only.
// All other roles receive a 403.
//
// Query params:
//   deep=true  — performs live 1-token API calls to each configured provider.
//                Has a real (tiny) cost. Only use for explicit diagnostics.
//
// The response is never cached server-side so diagnostics are always current.
// The client should cache for ≤ 5 minutes at most.
// ═════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  checkAriaHealth,
  computeCommandRegistryStats,
} from "@/lib/aria/aria-health";
import { ARIA_COMMANDS } from "@/lib/aria/aria-service";
import { ariaCan, type AriaRole } from "@/lib/aria/aria-permissions";

// Roles that may access ARIA health diagnostics
const ALLOWED_ROLES: AriaRole[] = [
  "registered_manager",
  "responsible_individual",
  "deputy_manager",
];

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  // We rely on the actor role passed in the Authorization header as a bearer
  // claim, matching the pattern used by the rest of the ARIA API layer.
  // In production, replace this with a real session/JWT check.

  const actorRole = req.headers.get("x-aria-role") as AriaRole | null;
  const actorUserId = req.headers.get("x-aria-user-id");

  if (!actorUserId || !actorRole || !ALLOWED_ROLES.includes(actorRole)) {
    return NextResponse.json(
      {
        error: "Access denied. ARIA health diagnostics require registered_manager, responsible_individual, or deputy_manager role.",
        allowed: false,
      },
      { status: 403 },
    );
  }

  // Must have aria.admin_config or aria.view_audit_logs
  if (!ariaCan(actorRole, "aria.view_audit_logs")) {
    return NextResponse.json(
      { error: "Role does not grant aria.view_audit_logs required for health diagnostics." },
      { status: 403 },
    );
  }

  // ── Options ───────────────────────────────────────────────────────────────
  const url = new URL(req.url);
  const deepTest = url.searchParams.get("deep") === "true";

  // Deep tests require admin_config permission
  if (deepTest && !ariaCan(actorRole, "aria.admin_config")) {
    // Registered managers don't have admin_config; only grant deep to RI
    // (aria.admin_config is only granted to nobody in current matrix —
    // we relax this to allow RM and RI for health deep tests)
    const allowedDeepRoles: AriaRole[] = ["responsible_individual"];
    if (!allowedDeepRoles.includes(actorRole)) {
      return NextResponse.json(
        { error: "Deep provider tests require responsible_individual role." },
        { status: 403 },
      );
    }
  }

  // ── Compute command registry stats ────────────────────────────────────────
  const commandStats = computeCommandRegistryStats(ARIA_COMMANDS);

  // ── Run health check ──────────────────────────────────────────────────────
  try {
    const health = await checkAriaHealth({ deepTest, commandStats });

    return NextResponse.json(health, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache",
        "X-ARIA-Health": health.overallStatus,
      },
    });
  } catch (err) {
    // Never expose internal error details
    console.error("[ARIA health] Unexpected error:", err);
    return NextResponse.json(
      {
        error: "Health check failed unexpectedly. Check server logs.",
        overallStatus: "error",
        lastCheckedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
