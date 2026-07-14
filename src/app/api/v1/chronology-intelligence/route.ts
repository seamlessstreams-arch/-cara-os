// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHRONOLOGY INTELLIGENCE API ROUTE
// GET /api/v1/chronology-intelligence
// Returns event patterns, recording gaps, category coverage, timeline analysis,
// and Cara chronology insights for all children.
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
  // YoungPerson has no name/admission_date fields — both old reads were
  // undefined, so every child fell back to the hardcoded 2025-01-01 baseline.
  const children: ChildInput[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name || yp.first_name,
    placement_start_date: yp.placement_start || "2025-01-01",
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
