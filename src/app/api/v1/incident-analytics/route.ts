// ══════════════════════════════════════════════════════════════════════════════
// CARA — INCIDENT ANALYTICS API ROUTE
// GET /api/v1/incident-analytics
// Returns incident trend analysis, severity breakdown, patterns.
// Reg 12/40/45 — protection, notification, quality monitoring.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { safeList } from "@/lib/api/safe-list";
import { dal } from "@/lib/db/dal";
import {
  computeIncidentAnalytics,
  type IncidentInput,
  type ChildRef,
} from "@/lib/engines/incident-analytics-engine";

// Read a dal collection defensively: a transient query failure degrades to an
// empty list rather than 500-ing the whole route.

export async function GET() {
  const [incidentRecords, youngPeople] = await Promise.all([
    safeList(dal.incidents.findAll()),
    safeList(dal.youngPeople.findAll()),
  ]);

  // ── Map incidents ─────────────────────────────────────────────────────
  const incidents: IncidentInput[] = incidentRecords.map((i) => ({
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
  const children: ChildRef[] = youngPeople.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name,
  }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeIncidentAnalytics({ incidents, children });

  return NextResponse.json({ data: result });
}
