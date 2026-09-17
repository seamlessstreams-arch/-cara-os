// ═════════════════════════════════════════════════════════════════════════════
// API: GET /api/v1/cara/health
//
// Returns the full CaraHealthStatus diagnostic object.
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
  checkCaraHealth,
  computeCommandRegistryStats,
} from "@/lib/cara/cara-health";
import { CARA_COMMANDS } from "@/lib/cara/cara-service";
import { caraCan, appRoleToCaraRole, type CaraRole } from "@/lib/cara/cara-permissions";
import { getRequestIdentity } from "@/lib/auth-guard";

// Roles that may access Cara health diagnostics
const ALLOWED_ROLES: CaraRole[] = [
  "registered_manager",
  "responsible_individual",
  "deputy_manager",
];

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  // The role comes from the validated session, never from the request.
  //
  // This route previously read x-cara-role / x-cara-user-id straight off the
  // request ("In production, replace this with a real session/JWT check" — that
  // replacement is this). Two problems, both live:
  //   • Forgeable. Any signed-in user could send x-cara-role:
  //     responsible_individual and read the diagnostics.
  //   • Wrong in the other direction too. The browser populates those headers
  //     from the CLIENT auth context, which is still the demo identity
  //     (AuthProvider's staff_darren, steered by the sidebar role switcher) —
  //     unrelated to who is actually signed in. A real registered manager was
  //     denied because the switcher happened to hold a non-manager role.
  //
  // getRequestIdentity resolves auth.uid() → staff_members in activated mode and
  // falls back to the X-User-Id convention in demo, so both modes keep working.
  // The headers are no longer read at all: a fallback would restore the hole.
  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;

  const actorRole: CaraRole = appRoleToCaraRole(identity.role);

  if (!ALLOWED_ROLES.includes(actorRole)) {
    return NextResponse.json(
      {
        error: "Access denied. Cara health diagnostics require registered_manager, responsible_individual, or deputy_manager role.",
        allowed: false,
      },
      { status: 403 },
    );
  }

  // Must have cara.admin_config or cara.view_audit_logs
  if (!caraCan(actorRole, "cara.view_audit_logs")) {
    return NextResponse.json(
      { error: "Role does not grant cara.view_audit_logs required for health diagnostics." },
      { status: 403 },
    );
  }

  // ── Options ───────────────────────────────────────────────────────────────
  const url = new URL(req.url);
  const deepTest = url.searchParams.get("deep") === "true";

  // Deep tests require admin_config permission
  if (deepTest && !caraCan(actorRole, "cara.admin_config")) {
    // Registered managers don't have admin_config; only grant deep to RI
    // (cara.admin_config is only granted to nobody in current matrix —
    // we relax this to allow RM and RI for health deep tests)
    const allowedDeepRoles: CaraRole[] = ["responsible_individual"];
    if (!allowedDeepRoles.includes(actorRole)) {
      return NextResponse.json(
        { error: "Deep provider tests require responsible_individual role." },
        { status: 403 },
      );
    }
  }

  // ── Compute command registry stats ────────────────────────────────────────
  const commandStats = computeCommandRegistryStats(CARA_COMMANDS);

  // ── Run health check ──────────────────────────────────────────────────────
  try {
    const health = await checkCaraHealth({ deepTest, commandStats });

    return NextResponse.json(health, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache",
        "X-Cara-Health": health.overallStatus,
      },
    });
  } catch (err) {
    // Never expose internal error details
    console.error("[Cara health] Unexpected error:", err);
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
