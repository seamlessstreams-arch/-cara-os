// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INCIDENT ANALYTICS API ROUTE
// GET /api/v1/incident-analytics
// Returns incident trend analysis, severity breakdown, patterns.
// Reg 12/40/45 — protection, notification, quality monitoring.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeIncidentAnalytics,
  type IncidentInput,
  type ChildRef,
} from "@/lib/engines/incident-analytics-engine";

export async function GET() {
  const store = getStore();

  // ── Map incidents ─────────────────────────────────────────────────────
  const incidents: IncidentInput[] = store.incidents.map((i) => ({
    id: i.id,
    child_id: i.child_id,
    date: i.date,
    time: i.time,
    type: i.type,
    severity: i.severity,
    status: i.status,
    requires_oversight: i.requires_oversight,
    oversight_by: i.oversight_by ?? null,
  }));

  // ── Build child name lookup ───────────────────────────────────────────
  const children: ChildRef[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name,
  }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeIncidentAnalytics({ incidents, children });

  return NextResponse.json({ data: result });
}
