// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POSSESSIONS INTELLIGENCE API ROUTE
// GET /api/v1/possessions-intelligence
// Returns children's property and possessions analysis: inventory completeness,
// photo compliance, insurance coverage, missing/damaged items, and ARIA insights.
// Reg 20: children's belongings must be safeguarded
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computePossessionsIntelligence,
  type PossessionInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/possessions-intelligence-engine";

export async function GET() {
  const store = getStore();

  const possessions: PossessionInput[] = [];
  for (const record of store.belongingsRecords ?? []) {
    for (const item of (record as any).items ?? []) {
      possessions.push({
        id: item.id,
        child_id: (record as any).child_id,
        item_name: item.description ?? "",
        category: mapCategory(item.category ?? "other"),
        date_logged: typeof item.date_logged === "string" ? item.date_logged.slice(0, 10) : "",
        value_estimate: item.estimated_value ?? 0,
        condition: mapCondition(item.status ?? item.condition ?? "good"),
        photo_logged: item.photo_on_file ?? false,
        insured: false,
        notes: item.notes ?? "",
      });
    }
  }

  const children: ChildRef[] = (store.youngPeople ?? []).map((yp: any) => ({
    id: yp.id,
    name: yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`,
  }));

  const staff: StaffRef[] = (store.staff ?? [])
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  const result = computePossessionsIntelligence({ possessions, children, staff });
  return NextResponse.json({ data: result });
}

function mapCategory(category: string): string {
  switch (category) {
    case "jewellery": return "sentimental";
    case "books_media": return "other";
    case "sports_equipment": return "other";
    case "furniture": return "other";
    case "toiletries": return "other";
    default: return category;
  }
}

function mapCondition(status: string): string {
  switch (status) {
    case "lost": return "missing";
    case "in_possession": return "good";
    case "in_storage": return "good";
    case "returned_to_family": return "returned";
    case "disposed": return "fair";
    case "damaged": return "poor";
    default: return status;
  }
}
