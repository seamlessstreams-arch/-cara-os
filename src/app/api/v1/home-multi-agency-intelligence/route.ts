// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MULTI-AGENCY INTELLIGENCE API ROUTE
// GET /api/v1/home-multi-agency-intelligence
// Multi-agency meetings, professional attendance, IRO correspondence, police.
// Working Together 2023 / CHR 2015 Reg 5/22.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeMultiAgency,
  type MultiAgencyMeetingInput,
  type ProfessionalMeetingInput,
  type IROCorrespondenceInput,
  type PoliceContactInput,
} from "@/lib/engines/home-multi-agency-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Unique children ─────────────────────────────────────────────────
  const childIds = new Set<string>();
  for (const r of ((store.youngPeople ?? []).filter((c: any) => c.status === "current")) as any[]) {
    if (r.id) childIds.add(r.id.toString());
  }
  const total_children = childIds.size;

  // ── Multi-Agency Meetings ───────────────────────────────────────────
  const multi_agency_meetings: MultiAgencyMeetingInput[] = (
    (store.multiAgencyMeetings ?? []) as any[]
  ).map((m: any) => ({
    id: (m.id ?? "").toString(),
    child_id: (m.child_id ?? "").toString(),
    meeting_type: (m.meeting_type ?? "").toString(),
    meeting_status: (m.meeting_status ?? "scheduled").toString(),
    date: (m.date ?? "").toString().slice(0, 10),
    child_participation: (m.child_participation ?? "").toString(),
    action_items_count: Array.isArray(m.action_items) ? m.action_items.length : (typeof m.action_items_count === "number" ? m.action_items_count : 0),
    actions_completed: Array.isArray(m.action_items) ? (m.action_items as any[]).filter((a: any) => a.status === "completed").length : (typeof m.actions_completed === "number" ? m.actions_completed : 0),
    attendees_count: Array.isArray(m.attendees) ? m.attendees.length : (typeof m.attendees_count === "number" ? m.attendees_count : 0),
  }));

  // ── Professional Meetings ───────────────────────────────────────────
  const professional_meetings: ProfessionalMeetingInput[] = (
    (store.professionalMeetingAttendances ?? []) as any[]
  ).map((m: any) => ({
    id: (m.id ?? "").toString(),
    child_id: (m.child_id ?? "").toString(),
    meeting_date: (m.meeting_date ?? "").toString().slice(0, 10),
    meeting_type: (m.meeting_type ?? "").toString(),
    child_attended: !!(m.child_attended),
    agencies_present: Array.isArray(m.agencies_present) ? m.agencies_present.map((a: any) => a.toString()) : [],
    actions_for_home_count: typeof m.actions_for_home_count === "number" ? m.actions_for_home_count : (Array.isArray(m.actions_for_home) ? m.actions_for_home.length : 0),
    report_submitted: !!(m.report_submitted),
    home_contribution: (m.home_contribution ?? "").toString(),
  }));

  // ── IRO Correspondence ──────────────────────────────────────────────
  const iro_correspondence: IROCorrespondenceInput[] = (
    (store.iroCorrespondences ?? []) as any[]
  ).map((c: any) => ({
    id: (c.id ?? "").toString(),
    child_id: (c.child_id ?? "").toString(),
    date: (c.date ?? "").toString().slice(0, 10),
    direction: (c.direction ?? "from_iro").toString(),
    response_required: !!(c.response_required),
    response_sent: !!(c.response_sent),
    response_deadline: (c.response_deadline ?? "").toString().slice(0, 10),
    formal_dispute: !!(c.formal_dispute),
  }));

  // ── Police Contacts ─────────────────────────────────────────────────
  const police_contacts: PoliceContactInput[] = (
    (store.policeContactRecords ?? []) as any[]
  ).map((p: any) => ({
    id: (p.id ?? "").toString(),
    child_id: (p.child_id ?? "").toString(),
    contact_date: (p.contact_date ?? "").toString().slice(0, 10),
    home_protocol_followed: !!(p.home_protocol_followed),
    concordat_principles_applied: !!(p.concordat_principles_applied),
    appropriate_adult_present: !!(p.appropriate_adult_present),
    restorative_opportunity: !!(p.restorative_opportunity),
    follow_up_required: !!(p.follow_up_required),
    follow_up_action: p.follow_up_action ? (p.follow_up_action).toString() : null,
  }));

  const result = computeHomeMultiAgency({
    today,
    multi_agency_meetings,
    professional_meetings,
    iro_correspondence,
    police_contacts,
    total_children,
  });

  return NextResponse.json({ data: result });
}
