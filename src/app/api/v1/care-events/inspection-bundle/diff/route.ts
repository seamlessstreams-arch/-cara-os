// ══════════════════════════════════════════════════════════════════════════════
// API — Inspection Bundle Diff  (Milestone 44)
//
// GET ?current_id=&previous_id=
//   previous_id may be omitted ⇒ treat previous as empty baseline.
// Permission: aria.view_audit_logs (read-only inspector / RI signal).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { diffInspectionBundles } from "@/lib/care-events/inspection-bundle-diff";
import { getPersistedInspectionBundle } from "@/lib/care-events/inspection-bundle";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const currentId = searchParams.get("current_id");
  const previousId = searchParams.get("previous_id");

  if (!currentId) {
    return NextResponse.json({ error: "current_id is required" }, { status: 400 });
  }

  const currentRow = getPersistedInspectionBundle(currentId);
  if (!currentRow) {
    return NextResponse.json({ error: "current bundle not found" }, { status: 404 });
  }

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId: currentRow.home_id,
    intent: "diff inspection bundles",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const diff = diffInspectionBundles(currentId, previousId ?? null);
  if (!diff) {
    return NextResponse.json({ error: "previous bundle not found" }, { status: 404 });
  }

  return NextResponse.json({ data: diff });
}
