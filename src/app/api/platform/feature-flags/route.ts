import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { describeFlags } from "@/lib/config/feature-flags";

// Read-only introspection of the operational feature-flag registry (Phase 1 · §
// foundation). Management-gated (manage_settings). Returns flag metadata + the
// resolved state in this environment — NO secrets. Demo-safe: the demo default
// identity (a Registered Manager) holds manage_settings, and with no env set
// every flag reports its documented default.
export async function GET(request: NextRequest) {
  const guard = await requirePermissionAsync(request, PERMISSIONS.MANAGE_SETTINGS);
  if (guard instanceof NextResponse) return guard;

  const flags = describeFlags();
  return NextResponse.json({
    flags,
    summary: {
      total: flags.length,
      enabled: flags.filter((f) => f.enabled).length,
      overridden: flags.filter((f) => f.overridden).length,
    },
  });
}
