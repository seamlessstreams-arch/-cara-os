// ==============================================================================
// CORNERSTONE -- WHISTLEBLOWING INTELLIGENCE API ROUTE
// GET /api/v1/whistleblowing-intelligence
// Returns whistleblowing disclosure analysis: investigation progress,
// protection compliance, PIDA adherence, and ARIA intelligence.
// Reg 41: whistleblowing -- Public Interest Disclosure Act 1998 (PIDA)
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeWhistleblowingIntelligence,
  type WhistleblowingInput,
  type StaffRef,
} from "@/lib/engines/whistleblowing-intelligence-engine";

export async function GET() {
  const store = getStore();

  const reports: WhistleblowingInput[] = (store.whistleblowingRecords ?? []).map((r: any) => {
    // Compute date_closed from last timeline entry for resolved/closed cases
    const isClosedStatus = r.status === "resolved" || r.status === "closed_no_action";
    let dateClosed: string | null = null;
    if (isClosedStatus && Array.isArray(r.timeline) && r.timeline.length > 0) {
      const lastEntry = r.timeline[r.timeline.length - 1];
      dateClosed = typeof lastEntry.date === "string" ? lastEntry.date.slice(0, 10) : null;
    }

    return {
      id: r.id,
      reference: r.reference ?? r.id,
      date_raised: typeof r.date_raised === "string" ? r.date_raised.slice(0, 10) : r.date_raised,
      anonymous: r.anonymous ?? false,
      category: r.category ?? "other",
      severity: r.severity ?? "medium",
      status: r.status ?? "received",
      assigned_to: r.assigned_to ?? "",
      external_referral: r.external_referral ?? null,
      outcome: r.outcome ?? "",
      lessons_learned: r.lessons_learned ?? "",
      protection_measures: r.protection_measures ?? [],
      date_closed: dateClosed,
    };
  });

  const staff: StaffRef[] = (store.staff ?? [])
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  const result = computeWhistleblowingIntelligence({ reports, staff });
  return NextResponse.json({ data: result });
}
