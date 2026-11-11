// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Annex A Live Snapshot
// GET  → list snapshots for a home (latest first)
// POST → run snapshot build (RBAC: cara.generate_drafts)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { tenantHomeId } from "@/lib/supabase/tenant";
import {
  loadAnnexASnapshots,
  runAnnexASnapshot,
} from "@/lib/cara/cara-annex-a-snapshot";
import {
  loadAnnexASnapshotsLive,
  runAnnexASnapshotLive,
} from "@/lib/cara-studio/annex-a-snapshot.service";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { readJsonBody } from "@/lib/http/read-json";

const DEFAULT_HOME_ID = tenantHomeId();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  // Live: snapshots persist in cara_studio_annex_a_snapshots (the store is
  // emptied on a live tenant). A read failure is surfaced, never shown as empty.
  if (isSupabaseEnabled()) {
    try {
      return NextResponse.json({ data: await loadAnnexASnapshotsLive(homeId) });
    } catch (err) {
      console.error("[cara-studio/annex-a-snapshot] GET live error:", err);
      return NextResponse.json({ error: "Failed to load snapshots", storage_unavailable: true }, { status: 503 });
    }
  }
  return NextResponse.json({ data: loadAnnexASnapshots(homeId) });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Record<string, unknown>;
  } catch {
    body = {};
  }

  const homeId = typeof body.home_id === "string" ? body.home_id : DEFAULT_HOME_ID;
  const periodStart = typeof body.period_start === "string" ? body.period_start : undefined;
  const periodEnd = typeof body.period_end === "string" ? body.period_end : undefined;

  const guard = await requireCaraStudioPermission(req, body, {
    permission: "cara.generate_drafts",
    homeId,
    intent: "run annex_a_snapshot",
  });
  if (!guard.ok) return guard.response;

  // Live: recompute from the home's real records and persist. A build/storage
  // failure surfaces as 503 rather than a silently empty snapshot.
  if (isSupabaseEnabled()) {
    try {
      const snapshot = await runAnnexASnapshotLive(homeId, { periodStart, periodEnd });
      return NextResponse.json({ data: snapshot }, { status: 201 });
    } catch (err) {
      console.error("[cara-studio/annex-a-snapshot] POST live error:", err);
      return NextResponse.json({ error: "Failed to build snapshot", storage_unavailable: true }, { status: 503 });
    }
  }

  const snapshot = runAnnexASnapshot(homeId, { periodStart, periodEnd });
  return NextResponse.json({ data: snapshot }, { status: 201 });
}
