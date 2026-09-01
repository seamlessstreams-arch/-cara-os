import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";
import {
  computeChildBehaviourSafety,
  type ChildBehaviourSafetyInput,
  type BehaviourEntryInput,
  type IncidentInput,
  type RestraintInput,
  type MissingEpisodeInput,
  type SanctionRewardInput,
  type SleepEntryInput,
  type BehaviourSupportPlanInput,
} from "@/lib/engines/child-behaviour-safety-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const childId = request.nextUrl.searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  // sleepLog is no longer fetched — see the sleep block below for why it can
  // never answer a per-child question. Fetching it was a round trip for data
  // this route could not use.
  const [behaviourLogList, behaviourSupportPlansList, incidentsList, missingEpisodesList, restraintsList, sanctionRewardsList, youngPeopleList] = await Promise.all([
      dal.behaviourLog.findAll(),
      dal.behaviourSupportPlans.findAll(),
      dal.incidents.findAll(),
      dal.missingEpisodes.findAll(),
      dal.restraints.findAll(),
      dal.sanctionRewards.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const today = todayStr();

  const child = youngPeopleList.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Unknown";

  // ── Behaviour Entries ─────────────────────────────────────────────────
  const behaviour_entries: BehaviourEntryInput[] = (behaviourLogList ?? [])
    .filter((b) => b.child_id === childId)
    .map((b) => ({
      id: b.id,
      date: (b.date ?? "").slice(0, 10),
      time: b.time ?? "12:00",
      // The engine keeps its own vocabulary for both of these. extended.ts
      // says concern / moderate / critical; the engine says concerning /
      // medium / severe. Same scales, different spellings — and that mismatch
      // is where the phantom `intensity === "severe"` comparisons came from.
      //
      // The seed used to hold BOTH spellings of both scales past a blanket
      // `as BehaviourEntry[]`, and testing for one while assuming the other
      // quietly filed every row spelled "concerning" as positive behaviour.
      // The seed now speaks the vocabulary BehaviourEntry declares, so this is
      // a straight translation between two type vocabularies rather than a
      // guess about the data. Testing "positive" — the value both scales spell
      // the same way — keeps it total either way.
      direction: b.direction === "positive" ? "positive" : "concerning",
      intensity:
        b.intensity === "moderate" ? "medium"
        : b.intensity === "critical" ? "severe"
        : b.intensity,
      title: b.title ?? "",
      trigger: b.trigger ?? "",
      strategy_used: b.strategy_used ?? "",
      outcome: b.outcome ?? "",
    }));

  // ── Incidents ─────────────────────────────────────────────────────────
  const childIncidents = (incidentsList ?? []).filter((i) => i.child_id === childId);

  // An Incident records neither whether de-escalation was tried nor whether a
  // physical intervention followed. A RestraintRecord records both, and links
  // back with `linked_incident_id` — so both are DERIVED from that evidence
  // rather than asserted. The route used to hard-code `false` for each, which
  // meant no incident in the system had ever de-escalated or been restrained.
  // An incident with no linked restraint stays false: nothing was recorded, and
  // "not evidenced" is the honest reading of that.
  const restraintsForChild = (restraintsList ?? []).filter((r) => r.child_id === childId);
  const incidents: IncidentInput[] = childIncidents.map((i) => {
    const linked = restraintsForChild.filter((r) => r.linked_incident_id === i.id);
    return {
      id: i.id,
      date: (i.date ?? "").slice(0, 10),
      type: i.type ?? "other",
      severity: i.severity ?? "medium",
      description: i.description ?? "",
      de_escalation_attempted: linked.some((r) => r.de_escalation_attempts.length > 0),
      physical_intervention: linked.length > 0,
      oversight_completed: !!i.oversight_note,
    };
  });

  // ── Restraints ────────────────────────────────────────────────────────
  // Every one of these was reading a field RestraintRecord does not have, so
  // the whole restraint-oversight picture was constants: de-escalation always
  // credited (`?? true`), debrief never credited, review never credited. The
  // record carries all three.
  const restraints: RestraintInput[] = restraintsForChild.map((r) => ({
    id: r.id,
    date: (r.date ?? "").slice(0, 10),
    duration_minutes: r.duration,
    reason: r.reason ?? "",
    type: r.restraint_type,
    de_escalation_attempted: r.de_escalation_attempts.length > 0,
    debrief_completed: r.child_debriefed && r.staff_debriefed,
    injuries: r.injuries.length,
    reviewed: r.review_status === "reviewed",
  }));

  // ── Missing Episodes ──────────────────────────────────────────────────
  const missing_episodes: MissingEpisodeInput[] = (missingEpisodesList ?? [])
    .filter((m) => m.child_id === childId)
    .map((m) => ({
      id: m.id,
      date: (m.date_missing ?? "").slice(0, 10),
      duration_hours: m.duration_hours ?? 0,
      // The engine distinguishes missing / absent / away_from_placement.
      // MissingEpisode records no such distinction, so every episode is what
      // the collection says it is. Stated as a constant rather than hidden
      // behind a read of a field that does not exist.
      category: "missing",
      risk_level: m.risk_level,
      return_interview_completed: m.return_interview_completed,
    }));

  // ── Sanctions / Rewards ───────────────────────────────────────────────
  const sanctions_rewards: SanctionRewardInput[] = (sanctionRewardsList ?? [])
    .filter((sr) => sr.child_id === childId)
    .map((sr) => ({
      id: sr.id,
      date: (sr.date ?? "").slice(0, 10),
      direction: sr.direction ?? "reward",
      title: sr.title ?? "",
      // absence-ok: dead default — SanctionRewardRecord.proportionate is a required boolean (verified 2026-08-31), so the fallback is unreachable
      proportionate: sr.proportionate ?? true,
      child_response: sr.child_response ?? "",
    }));

  // ── Sleep Entries ─────────────────────────────────────────────────────
  // `store.sleepLog` is the STAFF night-shift log: shift_type, staff_id,
  // building_secure, alarms_set. It has no child_id, so the filter below could
  // never match, and no bedtime, wake_time or quality either — the mapping was
  // inventing 21:30, 07:00 and a quality of 3 for entries that never arrived.
  //
  // Nothing in the system records a child's night-by-night sleep.
  // `sleepAssessmentRecords` is per-child but is a periodic assessment with
  // settling_time and average_hours, not a nightly bedtime and wake time —
  // mapping it here would mean inventing two of the four fields.
  //
  // So this stays empty and says why. The engine already reads fewer than four
  // entries as "insufficient_data", which is the correct answer.
  const sleep_entries: SleepEntryInput[] = [];

  // ── Behaviour Support Plan ────────────────────────────────────────────
  const bspRecords = (behaviourSupportPlansList ?? []).filter(
    (b) => b.child_id === childId,
  );
  let behaviour_support_plan: BehaviourSupportPlanInput | null = null;
  if (bspRecords.length > 0) {
    const sorted = [...bspRecords].sort(
      (a, b) =>
        new Date(b.last_reviewed ?? "").getTime() - new Date(a.last_reviewed ?? "").getTime(),
    );
    // Was `sorted[0] as any`, which turned off checking for the six reads
    // below — three of them named fields BehaviourSupportPlan does not have.
    const p = sorted[0];
    behaviour_support_plan = {
      id: p.id,
      status: p.status,
      last_reviewed: (p.last_reviewed ?? p.review_date ?? "").slice(0, 10),
      // These are structured on the plan (a de-escalation stage carries its own
      // strategies, a trigger carries a category and likelihood); the engine
      // wants the plain text. Projected, not asserted.
      strategies: p.de_escalation.flatMap((stage) => stage.strategies),
      triggers: p.known_triggers.map((t) => t.trigger),
      positive_approaches: p.positive_strategies.map((ps) => ps.strategy),
    };
  }

  const engineInput: ChildBehaviourSafetyInput = {
    today,
    child_id: childId,
    child_name: childName,
    behaviour_entries,
    incidents,
    restraints,
    missing_episodes,
    sanctions_rewards,
    sleep_entries,
    behaviour_support_plan,
  };

  const result = computeChildBehaviourSafety(engineInput);
  return NextResponse.json({ data: result });
}
