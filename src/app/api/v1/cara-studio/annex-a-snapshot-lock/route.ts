// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Annex A Snapshot lock
// PATCH → lock a draft snapshot (RBAC: cara.approve_outputs, safeguarding-sensitive)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { lockAnnexASnapshot } from "@/lib/cara/cara-annex-a-snapshot";
import {
  getAnnexASnapshotByIdLive,
  lockAnnexASnapshotLive,
} from "@/lib/cara-studio/annex-a-snapshot.service";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/read-json";

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : null;
  const note = typeof body.lock_note === "string" ? body.lock_note : null;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const live = isSupabaseEnabled();

  // Resolve the snapshot's home + status first — the store is emptied on a live
  // tenant, so on live this reads cara_studio_annex_a_snapshots. The home drives
  // the permission check; status drives the 404/409 decision.
  let homeId: string;
  if (live) {
    let existing;
    try {
      existing = await getAnnexASnapshotByIdLive(id);
    } catch (err) {
      console.error("[cara-studio/annex-a-snapshot-lock] read error:", err);
      return NextResponse.json({ error: "Storage unavailable", storage_unavailable: true }, { status: 503 });
    }
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status === "locked") return NextResponse.json({ error: "Snapshot already locked" }, { status: 409 });
    homeId = existing.home_id;
  } else {
    const existing = db.caraAnnexASnapshots.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status === "locked") return NextResponse.json({ error: "Snapshot already locked" }, { status: 409 });
    homeId = existing.home_id;
  }

  const guard = await requireCaraStudioPermission(req, body, {
    permission: "cara.approve_outputs",
    homeId,
    intent: "lock annex_a_snapshot",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  if (live) {
    try {
      const locked = await lockAnnexASnapshotLive(id, guard.actor.userId, note);
      return NextResponse.json({ data: locked });
    } catch (err) {
      console.error("[cara-studio/annex-a-snapshot-lock] lock error:", err);
      return NextResponse.json({ error: "Storage unavailable", storage_unavailable: true }, { status: 503 });
    }
  }

  const locked = lockAnnexASnapshot(id, guard.actor.userId, note);
  return NextResponse.json({ data: locked });
}
