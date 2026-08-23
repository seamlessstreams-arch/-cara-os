// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLAINTS CLOCK API ROUTE
// GET /api/v1/complaints-clock
//
// Per-complaint countdown to the statutory acknowledgement + response deadlines,
// with breach / at-risk flags. CHR 2015 Reg 39 — complaints handled within
// timescales. Reads complaintsList (the lifecycle Complaint records, which carry
// pre-computed acknowledgement_due / response_due dates).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { getStaffName } from "@/lib/seed-data";
import { computeComplaintsClock, type ComplaintInput } from "@/lib/engines/complaints-clock-engine";
import { todayStr } from "@/lib/utils";

const CLOSED_STATUSES = new Set(["closed", "resolved", "withdrawn", "not_upheld_closed"]);

export async function GET() {
  const [complaintsList, youngPeopleList] = await Promise.all([
      dal.complaints.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const today = todayStr();

  const yp = (youngPeopleList ?? []) as any[];
  const childName = (id?: string | null): string | undefined => {
    if (!id) return undefined;
    const c = yp.find((c) => c.id === id);
    return c ? (c.preferred_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || id) : undefined;
  };
  const staff = (id?: string | null): string | undefined => (id ? getStaffName(id) : undefined);
  const iso = (v: any): string | undefined => (v ? String(v).slice(0, 10) : undefined);

  const complaints: ComplaintInput[] = ((complaintsList ?? []) as any[]).map((c) => ({
    id: String(c.id ?? ""),
    reference: String(c.reference ?? c.id ?? ""),
    child_id: c.child_id ?? undefined,
    child_name: childName(c.child_id),
    complainant: String(c.complainant_name ?? c.complainant_type ?? "Complainant"),
    category: c.category ? String(c.category).replace(/_/g, " ") : undefined,
    summary: String(c.summary ?? ""),
    stage: c.stage ? String(c.stage) : undefined,
    status_raw: String(c.status ?? ""),
    assigned_to: staff(c.assigned_to),
    date_received: iso(c.date_received) ?? today,
    acknowledgement_due: iso(c.acknowledgement_due) ?? today,
    response_due: iso(c.response_due) ?? today,
    acknowledged_at: iso(c.acknowledged_at) ?? null,
    response_sent_at: iso(c.response_sent_at) ?? null,
    is_closed: CLOSED_STATUSES.has(String(c.status ?? "")),
  }));

  const result = computeComplaintsClock({ today, complaints });
  return NextResponse.json({ data: result });
}
