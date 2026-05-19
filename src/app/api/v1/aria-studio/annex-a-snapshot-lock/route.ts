// ══════════════════════════════════════════════════════════════════════════════
// API — ARIA Annex A Snapshot lock
// PATCH → lock a draft snapshot (RBAC: aria.approve_outputs, safeguarding-sensitive)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { lockAnnexASnapshot } from "@/lib/aria/aria-annex-a-snapshot";

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : null;
  const note = typeof body.lock_note === "string" ? body.lock_note : null;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = db.ariaAnnexASnapshots.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status === "locked") {
    return NextResponse.json({ error: "Snapshot already locked" }, { status: 409 });
  }

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.approve_outputs",
    homeId: existing.home_id,
    intent: "lock annex_a_snapshot",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const locked = lockAnnexASnapshot(id, guard.actor.userId, note);
  return NextResponse.json({ data: locked });
}
