// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME RECRUITMENT AUDIT TRAIL INTELLIGENCE API ROUTE
// GET /api/v1/home-recruitment-audit-trail-intelligence
// Synthesises recruitmentAudit, conditionalOffers, candidateProfiles, and
// vacancies to assess recruitment audit trail quality and completeness.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeRecruitmentAuditTrail,
  type AuditEntryInput,
  type ConditionalOfferInput,
  type CandidateProfileInput,
  type VacancyInput,
} from "@/lib/engines/home-recruitment-audit-trail-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.filter((s: any) => s.is_active !== false).length;

    // Recruitment audit entries
    const rawAudit = (store.recruitmentAudit ?? []) as any[];
    const audit_entries: AuditEntryInput[] = rawAudit.map((a: any) => ({
      id: a.id ?? "",
      candidate_id: a.candidate_id ?? "",
      vacancy_id: a.vacancy_id ?? "",
      actor_id: a.actor_id ?? "",
      event_type: a.event_type ?? "",
      entity_type: a.entity_type ?? "",
      entity_id: a.entity_id ?? "",
      has_before_state: a.before_state != null && a.before_state !== undefined,
      has_after_state: a.after_state != null && a.after_state !== undefined,
      has_notes: typeof a.notes === "string" && a.notes.trim().length > 0,
      created_at: (a.created_at ?? today).toString().slice(0, 10),
    }));

    // Conditional offers
    const rawOffers = (store.conditionalOffers ?? []) as any[];
    const offers: ConditionalOfferInput[] = rawOffers.map((o: any) => ({
      id: o.id ?? "",
      candidate_id: o.candidate_id ?? "",
      status: o.status ?? "conditional_sent",
      has_conditions: Array.isArray(o.conditions) && o.conditions.length > 0,
      conditions_count: Array.isArray(o.conditions) ? o.conditions.length : 0,
      exceptional_start: !!o.exceptional_start,
      has_risk_mitigation: typeof o.exceptional_start_risk_mitigation === "string" && o.exceptional_start_risk_mitigation.trim().length > 0,
      has_final_clearance: o.final_clearance_completed_at != null,
      proposed_start_date: (o.proposed_start_date ?? today).toString().slice(0, 10),
      created_at: (o.created_at ?? today).toString().slice(0, 10),
    }));

    // Candidate profiles
    const rawCandidates = (store.candidateProfiles ?? []) as any[];
    const candidates: CandidateProfileInput[] = rawCandidates.map((c: any) => ({
      id: c.id ?? "",
      stage: c.stage ?? "application_received",
      compliance_status: c.compliance_status ?? "not_started",
      has_dbs: !!(c.dbs_certificate_number || c.dbs_status === "clear" || c.dbs_status === "verified"),
      has_references: Array.isArray(c.references) ? c.references.length > 0 : (c.references_count ?? 0) > 0,
      references_count: Array.isArray(c.references) ? c.references.length : (c.references_count ?? 0),
      checks_count: Array.isArray(c.checks) ? c.checks.length : (c.checks_count ?? 0),
      created_at: (c.created_at ?? today).toString().slice(0, 10),
    }));

    // Vacancies
    const rawVacancies = (store.vacancies ?? []) as any[];
    const vacancies: VacancyInput[] = rawVacancies.map((v: any) => ({
      id: v.id ?? "",
      status: v.status ?? "open",
      candidates_count: Array.isArray(v.candidates) ? v.candidates.length : (v.candidates_count ?? 0),
      created_at: (v.created_at ?? today).toString().slice(0, 10),
    }));

    const result = computeRecruitmentAuditTrail({ today, total_staff, audit_entries, offers, candidates, vacancies });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
