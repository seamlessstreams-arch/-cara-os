// ══════════════════════════════════════════════════════════════════════════════
// API — Persisted Inspection Snapshot detail  (Milestone 31)
// GET /api/v1/care-events/inspection-snapshot/[id] → full payload
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { getPersistedSnapshot } from "@/lib/care-events/inspection-snapshot";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const snap = getPersistedSnapshot(id);
  if (!snap) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId: snap.home_id,
    intent: "view persisted inspection snapshot",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: snap });
}
