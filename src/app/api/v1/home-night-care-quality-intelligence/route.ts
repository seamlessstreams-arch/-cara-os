// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME NIGHT CARE QUALITY INTELLIGENCE API ROUTE
// GET /api/v1/home-night-care-quality-intelligence
// Night checks + night logs + handovers + sleep assessments + anxiety support
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeNightCareQuality } from "@/lib/engines/home-night-care-quality-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const result = computeNightCareQuality({
      today: new Date().toISOString().slice(0, 10),
      total_children: (store.youngPeople as any[])?.length ?? 0,
      night_checks: (store.nightChecks as any[]) ?? [],
      night_logs: (store.nightLogs as any[]) ?? [],
      night_staff_handovers: (store.nightStaffHandovers as any[]) ?? [],
      sleep_assessments: (store.sleepAssessmentRecords as any[]) ?? [],
      night_anxiety_support: (store.nightAnxietySupportRecords as any[]) ?? [],
    });
    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
