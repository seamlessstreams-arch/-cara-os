// ══════════���════════════════════════���══════════════════════════════��═══════════
// CARA — MULTI-AGENCY WORKING INTELLIGENCE API ROUTE
// GET /api/v1/multi-agency-intelligence
// Returns multi-agency working analysis: professional contacts, LAC reviews,
// meeting follow-up, child participation, and engagement intelligence.
// Reg 5, Reg 13, Working Together to Safeguard Children 2018.
// ══════════���═══════════���═════════════════════════════════════���═════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeMultiAgencyIntelligence,
  type LACReviewInput,
  type ProfessionalContactInput,
  type MultiAgencyMeetingInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/multi-agency-intelligence-engine";

// ── Frequency mapping ─────────────────────────────────────────────────────

const FREQUENCY_TO_DAYS: Record<string, number> = {
  weekly: 7,
  fortnightly: 14,
  monthly: 30,
  termly: 90,
  quarterly: 90,
  annually: 365,
};

export async function GET() {
  const [lacReviewsList, multiAgencyMeetingsList, professionalNetworkContactsList, staffList, youngPeopleList] = await Promise.all([dal.lacReviews.findAll(), dal.multiAgencyMeetings.findAll(), dal.professionalNetworkContacts.findAll(), dal.staff.findAll(), dal.youngPeople.findAll()]);

  // ── Map children ────────────────────────────���────────────────────────────
  const children: ChildRef[] = (youngPeopleList ?? []).map((yp: any) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name ?? "Unknown",
  }));

  // ── Map staff ─────────���──────────────────────────────��───────────────────
  const staff: StaffRef[] = (staffList ?? []).map((s: any) => ({
    id: s.id,
    name: s.name ?? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
  }));

  // ── Map LAC reviews ──────────��───────────────────────────────────��───────
  const lacReviews: LACReviewInput[] = (lacReviewsList ?? []).map((r: any) => ({
    id: r.id,
    child_id: r.child_id,
    review_type: r.review_type ?? "subsequent",
    date: r.date,
    iro_name: r.iro ?? "",
    child_participated: r.child_participation === "attended" || r.child_participation === "views_submitted" || r.child_participation === "advocate_attended",
    // LACReview does not record whether the home's report went in — unmeasured,
    // not assumed-submitted (the old `?? true` pinned the rate at 100% and
    // silenced the report-not-submitted alert for every review)
    home_report_submitted: null,
    care_plan_agreed: r.care_plan_updated ?? false,
    actions: (r.actions_agreed ?? []).map((a: any) => (typeof a === "string" ? a : a.action ?? "")),
    next_review_due: r.next_review_date ?? "",
  }));

  // ── Map professional contacts ────────────────────────────────────────────
  const professionalContacts: ProfessionalContactInput[] = (professionalNetworkContactsList ?? []).map((p: any) => ({
    id: p.id,
    child_id: p.child_id,
    professional_role: p.role ?? "other",
    name: p.name ?? "",
    last_contact_date: p.last_contact ?? "",
    contact_frequency_days: FREQUENCY_TO_DAYS[p.contact_frequency] ?? 30,
    status: p.is_active ? "active" : "inactive",
  }));

  // ── Map multi-agency meetings ────────��───────────────────────────────────
  const meetings: MultiAgencyMeetingInput[] = (multiAgencyMeetingsList ?? []).map((m: any) => {
    const actionItems = m.action_items ?? [];
    const actionsCount = actionItems.length;
    const actionsCompleted = actionItems.filter((a: { status?: string }) => a.status === "completed").length;
    return {
      id: m.id,
      meeting_type: m.meeting_type ?? "professionals_meeting",
      date: m.date,
      child_id: m.child_id,
      attendees: (m.attendees ?? []).map((a: any) => (typeof a === "string" ? a : a.name ?? "")),
      actions_count: actionsCount,
      actions_completed: actionsCompleted,
      home_report_submitted: null,
    };
  });

  // ── Run engine ───────────────────────────────────────────────��───────────
  const result = computeMultiAgencyIntelligence({
    lacReviews,
    professionalContacts,
    meetings,
    children,
    staff,
  });

  return NextResponse.json({ data: result });
}
