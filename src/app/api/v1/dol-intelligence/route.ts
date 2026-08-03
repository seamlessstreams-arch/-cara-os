// ══════════════════════════════════════════════════════════════════════════════
// CARA — DEPRIVATION OF LIBERTY INTELLIGENCE API ROUTE
// GET /api/v1/dol-intelligence
// Returns DoL order tracking, restriction analysis, proportionality reviews,
// child consultation compliance, and Cara liberty intelligence.
// Reg 20 — restraint and deprivation of liberty
// Reg 21 — privacy and access
// SCCIF Helped & Protected — evidence of proportionality
// Children Act 1989 — inherent jurisdiction orders
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeDoLIntelligence,
  type DoLRestrictionInput,
  type DoLOrderInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/dol-intelligence-engine";

export async function GET() {
  const [dolRecordsList, staffList, youngPeopleList] = await Promise.all([
      dal.dolRecords.findAll(),
      dal.staff.findAll(),
      dal.youngPeople.findAll(),
    ]);

  // ── Map children ────────────────────────────────────────────────────────────
  const children: ChildRef[] = youngPeopleList.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name,
  }));

  // ── Map staff ───────────────────────────────────────────────────────────────
  const staff: StaffRef[] = staffList.map((s) => ({
    id: s.id,
    name: s.first_name,
  }));

  // ── Map DoL records to restrictions ─────────────────────────────────────────
  const RESTRICTION_TYPE_MAP: Record<string, string> = {
    internet_monitoring: "internet_access",
    curfew: "curfew",
    geographic_restriction: "leave_unaccompanied",
    contact_restriction: "contact_with_person",
    confiscation: "mobile_phone",
    locked_doors: "leave_unaccompanied",
    window_restrictors: "leave_unaccompanied",
    bedroom_door_alarm: "curfew",
    cctv: "internet_access",
    search: "mobile_phone",
    other: "curfew",
  };

  const STATUS_MAP: Record<string, string> = {
    current: "active",
    under_review: "under_review",
    removed: "removed",
    expired: "removed",
    court_pending: "active",
  };

  const restrictions: DoLRestrictionInput[] = dolRecordsList.map((r) => {
    const lastReview = r.review_history.length > 0
      ? r.review_history[r.review_history.length - 1].date
      : r.date_imposed;
    const reviewDate = r.review_date;

    return {
      id: r.id,
      child_id: r.child_id,
      restriction_type: RESTRICTION_TYPE_MAP[r.restriction_type] ?? r.restriction_type,
      reason: r.description,
      date_imposed: r.date_imposed,
      last_reviewed: lastReview,
      next_review_due: reviewDate,
      child_consulted: r.child_consulted,
      child_view: r.child_views,
      social_worker_informed: r.sw_consulted,
      proportionate: r.proportionate,
      status: STATUS_MAP[r.status] ?? "active",
    };
  });

  // ── Map DoL records with court authority to orders ──────────────────────────
  const orders: DoLOrderInput[] = dolRecordsList
    .filter((r) => r.court_authorised && r.court_ref)
    .map((r) => ({
      id: `order_${r.id}`,
      child_id: r.child_id,
      order_type: r.legal_basis === "court_order" ? "inherent_jurisdiction" : "dol_order",
      start_date: r.date_imposed,
      expiry_date: r.review_date,
      status: r.status === "current" || r.status === "court_pending" ? "active" :
              r.status === "expired" ? "expired" : "active",
      court: "Family Court",
      conditions: r.alternatives_considered,
    }));

  // ── Run engine ──────────────────────────────────────────────────────────────
  const result = computeDoLIntelligence({ restrictions, orders, children, staff });

  return NextResponse.json({ data: result });
}
