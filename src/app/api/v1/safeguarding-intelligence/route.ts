// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFEGUARDING INTELLIGENCE API ROUTE
// GET /api/v1/safeguarding-intelligence
// Returns aggregated safeguarding intelligence from the engine.
// Reg 12/35/40/41 — safeguarding, behaviour management, notifications.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeSafeguardingIntelligence,
  type IncidentInput,
  type MissingEpisodeInput,
  type RestraintInput,
  type RiskAssessmentInput,
  type NotifiableEventInput,
  type ChildRef,
} from "@/lib/engines/safeguarding-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map incidents ─────────────────────────────────────────────────────
  const incidents: IncidentInput[] = store.incidents.map((i) => ({
    id: i.id,
    child_id: i.child_id,
    date: i.date,
    type: i.type,
    severity: i.severity,
    status: i.status,
    requires_oversight: i.requires_oversight,
    oversight_by: i.oversight_by ?? null,
  }));

  // ── Map missing episodes ──────────────────────────────────────────────
  const missingEpisodes: MissingEpisodeInput[] = store.missingEpisodes.map((m) => ({
    id: m.id,
    child_id: m.child_id,
    date_missing: m.date_missing,
    status: m.status,
    risk_level: m.risk_level,
    return_interview_completed: m.return_interview_completed,
    contextual_safeguarding_risk: m.contextual_safeguarding_risk,
  }));

  // ── Map restraints ────────────────────────────────────────────────────
  const restraints: RestraintInput[] = store.restraints.map((r) => ({
    id: r.id,
    child_id: r.child_id,
    date: r.date,
    duration: r.duration,
    reason: r.reason,
    restraint_type: r.restraint_type,
    injuries: (r.injuries ?? []).map((inj) => ({ person: inj.person, description: inj.injury })),
    child_debriefed: r.child_debriefed,
    staff_debriefed: r.staff_debriefed,
    review_status: r.review_status,
    de_escalation_attempts: r.de_escalation_attempts ?? [],
  }));

  // ── Map risk assessments ──────────────────────────────────────────────
  const riskAssessments: RiskAssessmentInput[] = store.riskAssessments.map((ra) => ({
    id: ra.id,
    child_id: ra.child_id,
    domain: ra.domain,
    current_level: ra.current_level,
    previous_level: ra.previous_level,
    trend: ra.trend,
    status: ra.status,
    review_date: ra.review_date,
    assessed_date: ra.assessed_date,
  }));

  // ── Map notifiable events ─────────────────────────────────────────────
  const notifiableEvents: NotifiableEventInput[] = store.notifiableEvents.map((ne) => ({
    id: ne.id,
    date: ne.date,
    event_type: ne.event_type,
    child_id: ne.child_id,
    ofsted_status: ne.ofsted_status,
  }));

  // ── Build child name lookup ───────────────────────────────────────────
  const children: ChildRef[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name,
  }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeSafeguardingIntelligence({
    incidents,
    missingEpisodes,
    restraints,
    riskAssessments,
    notifiableEvents,
    children,
  });

  return NextResponse.json({ data: result });
}
