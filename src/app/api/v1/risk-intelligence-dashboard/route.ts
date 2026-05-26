import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeRiskIntelligenceDashboard,
  type RiskIntelligenceDashboardInput,
  type RiskAssessmentInput,
  type ExploitationScreeningInput,
  type MissingEpisodeInput,
  type IncidentInput,
  type RestraintInput,
  type SignificantEventInput,
  type ChildSummaryInput,
} from "@/lib/engines/risk-intelligence-dashboard-engine";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const children: ChildSummaryInput[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || "Unknown",
  }));

  // ── Risk Assessments ──────────────────────────────────────────────────
  const risk_assessments: RiskAssessmentInput[] = (store.riskAssessments ?? []).map((ra: any) => {
    const child = store.youngPeople.find((yp) => yp.id === ra.child_id);
    const childName = child
      ? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim()
      : "Unknown";
    return {
      id: ra.id,
      child_id: ra.child_id,
      child_name: childName,
      domain: ra.domain ?? "general",
      current_level: ra.current_level ?? "medium",
      previous_level: ra.previous_level ?? ra.current_level ?? "medium",
      trend: ra.trend ?? "stable",
      status: ra.status ?? "current",
      assessed_date: (ra.assessed_date ?? ra.created_at ?? "").slice(0, 10),
      review_date: (ra.review_date ?? "").slice(0, 10),
      has_child_views: !!(ra.child_views),
      has_contingency_plan: !!(ra.contingency_plan),
      linked_incidents_count: (ra.linked_incidents ?? []).length,
      mitigations: (ra.mitigations ?? []).map((m: any) => ({
        strategy: m.strategy ?? "",
        effectiveness: m.effectiveness ?? "not_assessed",
      })),
    };
  });

  // ── Exploitation Screenings ───────────────────────────────────────────
  const exploitation_screenings: ExploitationScreeningInput[] = (store.exploitationScreenings ?? []).map((es: any) => {
    const child = store.youngPeople.find((yp) => yp.id === es.child_id);
    const childName = child
      ? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim()
      : "Unknown";
    return {
      id: es.id,
      child_id: es.child_id,
      child_name: childName,
      date: (es.date ?? es.created_at ?? "").slice(0, 10),
      exploitation_type: es.exploitation_type ?? "cse",
      risk_level: es.risk_level ?? "medium",
      previous_risk_level: es.previous_risk_level ?? null,
      status: es.status ?? "monitoring",
      next_review_date: (es.next_review_date ?? "").slice(0, 10),
      multi_agency_involved: es.multi_agency_involved ?? [],
      nrm_referral: es.nrm_referral ?? false,
      safety_plan_in_place: !!(es.safety_plan),
    };
  });

  // ── Missing Episodes ──────────────────────────────────────────────────
  const missing_episodes: MissingEpisodeInput[] = (store.missingEpisodes ?? []).map((m: any) => {
    const child = store.youngPeople.find((yp) => yp.id === m.child_id);
    const childName = child
      ? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim()
      : "Unknown";
    return {
      id: m.id,
      child_id: m.child_id,
      child_name: childName,
      date: (m.date_missing ?? m.date ?? "").slice(0, 10),
      duration_hours: m.duration_hours ?? 0,
      risk_level: m.risk_level ?? "medium",
      return_interview_completed: m.return_interview_completed ?? false,
      contextual_safeguarding_risk: m.contextual_safeguarding_risk ?? false,
      status: m.status ?? "closed",
    };
  });

  // ── Incidents ─────────────────────────────────────────────────────────
  const incident_entries: IncidentInput[] = (store.incidents ?? []).map((i: any) => {
    const child = store.youngPeople.find((yp) => yp.id === i.child_id);
    const childName = child
      ? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim()
      : "Unknown";
    return {
      id: i.id,
      child_id: i.child_id,
      child_name: childName,
      date: (i.date ?? i.created_at ?? "").slice(0, 10),
      type: i.type ?? "other",
      severity: i.severity ?? "medium",
      status: i.status ?? "closed",
      requires_oversight: i.requires_oversight ?? false,
      oversight_completed: !!(i.oversight_note),
    };
  });

  // ── Restraints ────────────────────────────────────────────────────────
  const restraint_entries: RestraintInput[] = (store.restraints ?? []).map((r: any) => {
    const child = store.youngPeople.find((yp) => yp.id === r.child_id);
    const childName = child
      ? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim()
      : "Unknown";
    return {
      id: r.id,
      child_id: r.child_id,
      child_name: childName,
      date: (r.date ?? r.created_at ?? "").slice(0, 10),
      duration_minutes: r.duration ?? 0,
      reason: r.reason ?? "",
      child_debriefed: r.child_debriefed ?? false,
      staff_debriefed: r.staff_debriefed ?? false,
      review_status: r.review_status ?? "pending",
      injuries: (r.injuries ?? []).length,
    };
  });

  // ── Significant Events ────────────────────────────────────────────────
  const significant_events: SignificantEventInput[] = (store.significantEvents ?? []).map((se: any) => {
    const child = store.youngPeople.find((yp) => yp.id === se.child_id);
    const childName = child
      ? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim()
      : "Unknown";
    return {
      id: se.id,
      child_id: se.child_id,
      child_name: childName,
      date: (se.date ?? se.created_at ?? "").slice(0, 10),
      category: se.category ?? "other",
      significance: se.significance ?? "significant",
    };
  });

  const engineInput: RiskIntelligenceDashboardInput = {
    today,
    children,
    risk_assessments,
    exploitation_screenings,
    missing_episodes,
    incidents: incident_entries,
    restraints: restraint_entries,
    significant_events,
  };

  const result = computeRiskIntelligenceDashboard(engineInput);
  return NextResponse.json({ data: result });
}
