// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLAINTS INTELLIGENCE API ROUTE
// GET /api/v1/complaints-intelligence
// Returns complaints handling analysis: response times, satisfaction,
// theme patterns, Reg 39/40 compliance, and Cara intelligence.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeComplaintsIntelligence,
  type ComplaintInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/complaints-intelligence-engine";

export async function GET() {
  const [complaintOutcomeRecordsList, staffList, youngPeopleList] = await Promise.all([
      dal.complaintOutcomeRecords.findAll(),
      dal.staff.findAll(),
      dal.youngPeople.findAll(),
    ]);

  const complaints: ComplaintInput[] = (complaintOutcomeRecordsList ?? []).map((c) => ({
    id: c.id,
    complaint_date: typeof c.complaint_date === "string" ? c.complaint_date.slice(0, 10) : c.complaint_date,
    complainant: c.complainant,
    source: c.source,
    theme: c.theme,
    outcome: c.outcome,
    investigated_by: c.investigated_by ?? "",
    date_resolved: c.date_resolved ? (typeof c.date_resolved === "string" ? c.date_resolved.slice(0, 10) : c.date_resolved) : null,
    response_time_days: c.response_time_days ?? 0,
    child_id: c.child_id ?? null,
    summary: c.summary ?? "",
    lessons_learned: c.lessons_learned ?? "",
    practice_changes: c.practice_changes ?? [],
    complainant_satisfied: c.complainant_satisfied ?? null,
    escalated: c.escalated ?? false,
    ofsted_notified: c.ofsted_notified ?? false,
  }));

  const children: ChildRef[] = (youngPeopleList ?? []).map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`,
  }));

  const staff: StaffRef[] = (staffList ?? [])
    .filter((s) => s.is_active)
    .map((s) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  const result = computeComplaintsIntelligence({ complaints, children, staff });
  return NextResponse.json({ data: result });
}
