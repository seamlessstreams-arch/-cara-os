// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SAFEGUARDING INTELLIGENCE API ROUTE
// GET /api/v1/home-safeguarding-intelligence
// Synthesises contextual safeguarding risks, exploitation screenings, and
// online safety incidents to assess home-level safeguarding quality,
// multi-agency engagement, and risk management effectiveness.
// CHR 2015 Reg 12, 13, 34. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeSafeguarding,
  type ContextualRiskInput,
  type ExploitationScreeningInput,
  type OnlineSafetyInput,
} from "@/lib/engines/home-safeguarding-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;
  const childIds = youngPeople.map((yp: any) => yp.id as string);

  // ── Contextual Safeguarding Risks ─────────────────────────────────────
  const contextualRisks: ContextualRiskInput[] = ((store.contextualSafeguardingRisks ?? []) as any[])
    .map((r: any) => ({
      id: r.id,
      date_identified: (r.date_identified ?? today).toString().slice(0, 10),
      risk_level: r.risk_level ?? "medium",
      status: r.status ?? "active",
      children_affected_count: Array.isArray(r.children_affected) ? r.children_affected.length : 0,
      has_protective_actions: Array.isArray(r.protective_actions) ? r.protective_actions.length > 0 : false,
      has_multi_agency_actions: Array.isArray(r.multi_agency_actions) ? r.multi_agency_actions.length > 0 : false,
      review_date: (r.review_date ?? today).toString().slice(0, 10),
      last_reviewed: (r.last_reviewed ?? r.date_identified ?? today).toString().slice(0, 10),
    }));

  // ── Exploitation Screenings ───────────────────────────────────────────
  const exploitationScreenings: ExploitationScreeningInput[] = ((store.exploitationScreenings ?? []) as any[])
    .map((s: any) => ({
      id: s.id,
      date: (s.date ?? today).toString().slice(0, 10),
      child_id: s.child_id ?? "",
      risk_level: s.risk_level ?? "low",
      previous_risk_level: s.previous_risk_level ?? null,
      status: s.status ?? "initial_screening",
      has_safety_plan: !!(s.safety_plan),
      multi_agency_count: Array.isArray(s.multi_agency_involved) ? s.multi_agency_involved.length : 0,
      nrm_referral: !!(s.nrm_referral),
      social_worker_notified: !!(s.social_worker_notified),
      review_date: (s.next_review_date ?? s.review_date ?? today).toString().slice(0, 10),
    }));

  // ── Online Safety Incidents ───────────────────────────────────────────
  const onlineSafetyIncidents: OnlineSafetyInput[] = ((store.onlineSafetyIncidents ?? []) as any[])
    .map((o: any) => ({
      id: o.id,
      date: (o.date ?? today).toString().slice(0, 10),
      child_id: o.child_id ?? "",
      severity: o.severity ?? "low",
      status: o.status ?? "open",
      has_safeguarding_referral: !!(o.safeguarding_referral),
      has_child_discussion: !!(o.child_discussion),
      has_follow_up: !!(o.follow_up),
      parent_notified: !!(o.parent_carer_notified),
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeSafeguarding({
    today,
    total_children: totalChildren,
    child_ids: childIds,
    contextual_risks: contextualRisks,
    exploitation_screenings: exploitationScreenings,
    online_safety_incidents: onlineSafetyIncidents,
  });

  return NextResponse.json({ data: result });
}
