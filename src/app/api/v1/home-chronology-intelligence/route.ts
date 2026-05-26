// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CHRONOLOGY INTELLIGENCE API ROUTE
// GET /api/v1/home-chronology-intelligence
// Synthesises chronology event patterns, documentation quality, category
// distribution, significance tracking, and incident linkage.
// CHR 2015 Reg 36 (Record Keeping). SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeChronology,
  type ChronologyEntryInput,
} from "@/lib/engines/home-chronology-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const entries: ChronologyEntryInput[] = ((store.chronology ?? []) as any[])
    .map((e: any) => ({
      id: e.id ?? "",
      child_id: e.child_id ?? "",
      date: (e.date ?? "").toString().slice(0, 10),
      category: e.category ?? "other",
      significance: e.significance ?? "routine",
      has_linked_incident: !!(e.linked_incident_id),
      has_description: !!(e.description),
      has_time: !!(e.time),
    }));

  const totalChildren = (store.youngPeople ?? [])
    .filter((yp: any) => yp.status === "current").length;

  const result = computeHomeChronology({
    today,
    entries,
    total_children: totalChildren,
  });

  return NextResponse.json({ data: result });
}
