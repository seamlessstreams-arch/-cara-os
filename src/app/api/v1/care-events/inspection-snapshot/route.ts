// ══════════════════════════════════════════════════════════════════════════════
// API — Inspection Snapshot Bundle  (Milestones 30 + 31)
//
// GET  ?home_id=    → list previously persisted snapshots (newest first)
// POST { home_id }  → generate AND persist a new snapshot, return full payload
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import {
  generateInspectionSnapshot,
  persistInspectionSnapshot,
  listPersistedSnapshots,
} from "@/lib/care-events/inspection-snapshot";
import { appendAriaAudit } from "@/lib/aria/aria-audit-trail";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "list inspection snapshots",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: listPersistedSnapshots(homeId) });
}

export async function POST(req: NextRequest) {
  let body: { home_id?: string } = {};
  try { body = await req.json(); } catch { /* allow empty body */ }
  const homeId = body.home_id ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(req, body as Record<string, unknown>, {
    permission: "aria.commit_to_records",
    homeId,
    intent: "persist inspection snapshot",
  });
  if (!guard.ok) return guard.response;

  const snap = generateInspectionSnapshot(homeId, { generatedBy: guard.actor.userId });
  persistInspectionSnapshot(snap);

  appendAriaAudit({
    homeId,
    actorId: guard.actor.userId,
    actionType: "artifact_committed",
    artifactId: snap.id,
    sourceIds: [],
    summary: `Inspection snapshot persisted (readiness ${snap.headline.readiness_score})`,
    after: { schema_version: snap.schema_version, headline: snap.headline },
  });

  return NextResponse.json({ data: snap });
}
