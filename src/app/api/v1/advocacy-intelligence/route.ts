// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ADVOCACY INTELLIGENCE API ROUTE
// GET /api/v1/advocacy-intelligence
// Returns advocacy referral analysis: access coverage, referral timeliness,
// visit frequency, children's participation, and ARIA intelligence.
// Reg 7: children's wishes — Reg 14: needs assessment
// Reg 45: quality of care review — Children Act 1989 s26: advocacy for LAC
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeAdvocacyIntelligence,
  type AdvocacyInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/advocacy-intelligence-engine";

export async function GET() {
  const store = getStore();

  const referrals: AdvocacyInput[] = (store.advocacyRecords ?? []).map((r: any) => {
    const visits: { date: string; summary: string; outcome: string }[] = r.visits ?? [];
    const lastVisit = visits.length > 0
      ? visits.reduce((latest, v) => (v.date > latest ? v.date : latest), visits[0].date)
      : null;

    return {
      id: r.id,
      child_id: r.child_id,
      advocacy_type: r.advocacy_type ?? "independent",
      status: r.status ?? "active",
      provider: r.provider ?? "",
      advocate_name: r.advocate_name ?? "",
      referral_date: typeof r.referral_date === "string" ? r.referral_date.slice(0, 10) : r.referral_date,
      start_date: r.start_date
        ? (typeof r.start_date === "string" ? r.start_date.slice(0, 10) : r.start_date)
        : null,
      reason: r.reason ?? "",
      issues_raised: r.issues_raised ?? [],
      visit_count: visits.length,
      last_visit_date: lastVisit
        ? (typeof lastVisit === "string" ? lastVisit.slice(0, 10) : lastVisit)
        : null,
      child_view: r.child_view ?? "",
      review_date: typeof r.review_date === "string" ? r.review_date.slice(0, 10) : r.review_date,
    };
  });

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

  const result = computeAdvocacyIntelligence({ referrals, children, staff });
  return NextResponse.json({ data: result });
}
