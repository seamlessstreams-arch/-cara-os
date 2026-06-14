// ══════════════════════════════════════════════════════════════════════════════
// API — Per-artifact Export History  (Milestone 38)
//
// GET /api/v1/care-events/exports/by-artifact?artifact_id=...&home_id=...
//   → ExportHistoryEntry[] for that artifact, newest-first.
// Permission: cara.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { listExportsForArtifact } from "@/lib/care-events/export-history";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artifactId = searchParams.get("artifact_id");
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  if (!artifactId) {
    return NextResponse.json({ error: "artifact_id_required" }, { status: 400 });
  }

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view per-artifact export history",
  });
  if (!guard.ok) return guard.response;

  const entries = listExportsForArtifact(artifactId);
  // safety: only return entries belonging to the requested home
  const scoped = entries.filter((e) => e.home_id === homeId);
  return NextResponse.json({ data: scoped });
}
