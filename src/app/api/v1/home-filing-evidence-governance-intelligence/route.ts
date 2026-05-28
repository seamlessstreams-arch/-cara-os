// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FILING EVIDENCE GOVERNANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-filing-evidence-governance-intelligence
// Synthesises filingCabinet items and careEvents to assess evidence filing
// quality, verification governance, and Ofsted inspection readiness.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeFilingEvidenceGovernance,
  type FilingCabinetItemInput,
  type CareEventBasicInput,
} from "@/lib/engines/home-filing-evidence-governance-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.length;

    // Filing cabinet items
    const rawFiling = (store.filingCabinet ?? []) as any[];
    const filing_items: FilingCabinetItemInput[] = rawFiling.map((f: any) => ({
      id: f.id ?? "",
      care_event_id: f.care_event_id ?? null,
      home_id: f.home_id ?? "",
      child_id: f.child_id ?? null,
      category: f.category ?? "general",
      sub_category: f.sub_category ?? null,
      title: f.title ?? "",
      has_description: typeof f.description === "string" && f.description.trim().length > 0,
      source_type: f.source_type ?? "manual",
      linked_record_id: f.linked_record_id ?? null,
      linked_record_table: f.linked_record_table ?? null,
      is_verified: !!f.is_verified,
      verified_at: f.verified_at ?? null,
      verified_by: f.verified_by ?? null,
      tags_count: Array.isArray(f.tags) ? f.tags.length : 0,
      filed_at: (f.filed_at ?? f.created_at ?? today).toString(),
      created_at: (f.created_at ?? today).toString(),
      updated_at: (f.updated_at ?? today).toString(),
    }));

    // Care events (basic info for filing coverage analysis)
    const SIGNIFICANT_CATEGORIES = ["physical_intervention", "safeguarding", "missing", "health", "medication", "restraint", "incident", "allegation"];
    const rawEvents = (store.careEvents ?? []) as any[];
    const filingEventIds = new Set(rawFiling.map((f: any) => f.care_event_id).filter(Boolean));
    const care_events: CareEventBasicInput[] = rawEvents.map((e: any) => ({
      id: e.id ?? "",
      child_id: e.child_id ?? "",
      category: e.category ?? "general",
      date: (e.created_at ?? today).toString().slice(0, 10),
      is_significant: SIGNIFICANT_CATEGORIES.includes(e.category),
      has_filing: filingEventIds.has(e.id),
    }));

    const result = computeFilingEvidenceGovernance({ today, total_children, filing_items, care_events });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
