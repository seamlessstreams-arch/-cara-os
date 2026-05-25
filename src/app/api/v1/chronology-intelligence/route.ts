// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHRONOLOGY INTELLIGENCE API ROUTE
// GET /api/v1/chronology-intelligence
// Returns event patterns, recording gaps, category coverage, timeline analysis,
// and ARIA chronology insights for all children.
// Reg 36 — case records; SCCIF — comprehensive factual chronology.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeChronologyIntelligence,
  type ChildInput,
  type ChronologyEventInput,
  type EventCategory,
  type EventSignificance,
} from "@/lib/engines/chronology-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map children with placement start dates ─────────────────────────────────
  const children: ChildInput[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: yp.name,
    placement_start_date: yp.admission_date ?? yp.date_of_admission ?? "2025-01-01",
  }));

  // ── Map chronology events ───────────────────────────────────────────────────
  const events: ChronologyEventInput[] = store.chronology.map((c) => ({
    id: c.id,
    child_id: c.child_id,
    date: c.date,
    category: (c.category ?? "other") as EventCategory,
    title: c.title,
    significance: (c.significance ?? "routine") as EventSignificance,
    has_linked_incident: Boolean(c.linked_incident_id),
  }));

  // ── Run engine ──────────────────────────────────────────────────────────────
  const result = computeChronologyIntelligence({ children, events });

  return NextResponse.json({ data: result });
}
