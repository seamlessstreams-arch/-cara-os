// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR INTELLIGENCE API ROUTE
// GET /api/v1/behaviour-intelligence
// Returns aggregated behaviour support intelligence from the engine.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeBehaviourIntelligence,
  type BehaviourEntryInput,
  type IncidentInput,
  type RestraintInput,
  type SanctionRewardInput,
} from "@/lib/engines/behaviour-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map behaviour log entries ────────────────────────────────────────
  const behaviourEntries: BehaviourEntryInput[] = store.behaviourLog.map((e) => ({
    id: e.id,
    child_id: e.child_id,
    date: e.date,
    time: e.time,
    direction: e.direction,
    intensity: e.intensity,
    title: e.title,
    antecedent: e.antecedent,
    behaviour: e.behaviour,
    consequence: e.consequence,
    trigger: e.trigger,
    strategy_used: e.strategy_used,
    outcome: e.outcome,
    recorded_by: e.recorded_by,
  }));

  // ── Map incidents ────────────────────────────────────────────────────
  const incidents: IncidentInput[] = store.incidents.map((i) => ({
    id: i.id,
    child_id: i.child_id,
    date: i.date,
    time: i.time,
    type: i.type,
    severity: i.severity,
    description: i.description,
    immediate_action: i.immediate_action,
    status: i.status,
    body_map_completed: i.body_map_completed,
    reported_by: i.reported_by,
  }));

  // ── Map restraints ───────────────────────────────────────────────────
  const restraints: RestraintInput[] = store.restraints.map((r) => ({
    id: r.id,
    child_id: r.child_id,
    date: r.date,
    start_time: r.start_time,
    end_time: r.end_time,
    duration: r.duration,
    reason: r.reason,
    restraint_type: r.restraint_type,
    antecedent: r.antecedent,
    de_escalation_attempts: r.de_escalation_attempts,
    child_debriefed: r.child_debriefed,
    staff_debriefed: r.staff_debriefed,
    injuries: r.injuries.map((inj) => ({
      person: typeof inj === "object" && "person" in inj ? String(inj.person) : "unknown",
      description: typeof inj === "object" && "description" in inj ? String(inj.description) : "",
    })),
    review_status: r.review_status,
    recorded_by: r.recorded_by,
  }));

  // ── Map sanctions/rewards ────────────────────────────────────────────
  const sanctionRewards: SanctionRewardInput[] = store.sanctionRewards.map((sr) => ({
    id: sr.id,
    child_id: sr.child_id,
    date: sr.date,
    direction: sr.direction,
    title: sr.title,
    description: sr.description,
    context: sr.context,
    child_response: sr.child_response,
    outcome: sr.outcome,
    proportionate: sr.proportionate,
    recorded_by: sr.recorded_by,
  }));

  // ── Build YP name lookup ─────────────────────────────────────────────
  const ypNames = new Map(
    store.youngPeople.map((yp) => [yp.id, yp.preferred_name || yp.first_name]),
  );
  const childNameLookup = (id: string) =>
    ypNames.get(id) ?? id.replace("yp_", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Run engine ───────────────────────────────────────────────────────
  const result = computeBehaviourIntelligence({
    behaviourEntries,
    incidents,
    restraints,
    sanctionRewards,
    childNameLookup,
  });

  return NextResponse.json({ data: result });
}
