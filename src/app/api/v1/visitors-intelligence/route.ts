// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VISITORS INTELLIGENCE API ROUTE
// GET /api/v1/visitors-intelligence
// Returns visitor management analysis: compliance rates, category breakdown,
// per-child contact profiles, and ARIA visitor intelligence.
// Reg 12, Reg 22, Reg 44, SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeVisitorsIntelligence,
  type VisitorInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/visitors-intelligence-engine";

export async function GET() {
  const store = getStore();

  const visitors: VisitorInput[] = (store.visitors ?? []).map((v: any) => ({
    id: v.id,
    date: typeof v.date === "string" ? v.date.slice(0, 10) : v.date,
    visitor_name: v.visitor_name,
    organisation: v.organisation ?? null,
    category: v.category,
    purpose: v.purpose,
    dbs_checked: v.dbs_checked ?? false,
    id_verified: v.id_verified ?? false,
    sign_in_time: v.sign_in_time,
    sign_out_time: v.sign_out_time ?? null,
    status: v.status,
    host_staff_id: v.host_staff_id,
    children_seen: v.children_seen ?? [],
  }));

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

  const result = computeVisitorsIntelligence({ visitors, children, staff });

  return NextResponse.json({ data: result });
}
