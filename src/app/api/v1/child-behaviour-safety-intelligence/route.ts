import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
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
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const child = store.youngPeople.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Unknown";

  // ── Behaviour Entries ─────────────────────────────────────────────────
  const behaviour_entries: BehaviourEntryInput[] = (store.behaviourLog ?? [])
    .filter((b: any) => b.child_id === childId)
    .map((b: any) => ({
      id: b.id,
      date: (b.date ?? "").slice(0, 10),
      time: b.time ?? "12:00",
      direction: b.direction ?? "concerning",
      intensity: b.intensity ?? "medium",
      title: b.title ?? "",
      trigger: b.trigger ?? "",
      strategy_used: b.strategy_used ?? "",
      outcome: b.outcome ?? "",
    }));

  // ── Incidents ─────────────────────────────────────────────────────────
  const childIncidents = (store.incidents ?? []).filter(
    (i: any) => i.young_person_id === childId || i.child_id === childId,
  );
  const incidents: IncidentInput[] = childIncidents.map((i: any) => ({
    id: i.id,
    date: (i.date ?? i.incident_date ?? "").slice(0, 10),
    type: i.type ?? i.incident_type ?? "other",
    severity: i.severity ?? "medium",
    description: i.description ?? i.details ?? "",
    de_escalation_attempted: i.de_escalation_attempted ?? i.de_escalation ?? false,
    physical_intervention: i.physical_intervention ?? false,
    oversight_completed: i.oversight_completed ?? !!i.oversight_note ?? false,
  }));

  // ── Restraints ────────────────────────────────────────────────────────
  const restraints: RestraintInput[] = (store.restraints ?? [])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      id: r.id,
      date: (r.date ?? "").slice(0, 10),
      duration_minutes: r.duration ?? r.duration_minutes ?? 0,
      reason: r.reason ?? "",
      type: r.type ?? r.restraint_type ?? "other",
      de_escalation_attempted: r.de_escalation_attempted ?? r.de_escalation ?? true,
      debrief_completed: r.debrief_completed ?? r.debrief ?? false,
      injuries: Array.isArray(r.injuries) ? r.injuries.length : (r.injuries ?? 0),
      reviewed: r.reviewed ?? !!r.oversight_note ?? false,
    }));

  // ── Missing Episodes ──────────────────────────────────────────────────
  const missing_episodes: MissingEpisodeInput[] = (store.missingEpisodes ?? [])
    .filter((m: any) => m.child_id === childId)
    .map((m: any) => ({
      id: m.id,
      date: (m.date_missing ?? m.date ?? "").slice(0, 10),
      duration_hours: m.duration_hours ?? m.duration ?? 0,
      category: m.category ?? "missing",
      risk_level: m.risk_level ?? "medium",
      return_interview_completed: m.return_interview_completed ?? m.return_interview ?? false,
    }));

  // ── Sanctions / Rewards ───────────────────────────────────────────────
  const sanctions_rewards: SanctionRewardInput[] = (store.sanctionRewards ?? [])
    .filter((sr: any) => sr.child_id === childId)
    .map((sr: any) => ({
      id: sr.id,
      date: (sr.date ?? "").slice(0, 10),
      direction: sr.direction ?? "reward",
      title: sr.title ?? "",
      proportionate: sr.proportionate ?? true,
      child_response: sr.child_response ?? "",
    }));

  // ── Sleep Entries ─────────────────────────────────────────────────────
  const sleep_entries: SleepEntryInput[] = (store.sleepLog ?? [])
    .filter((s: any) => s.child_id === childId)
    .map((s: any) => ({
      id: s.id,
      date: (s.date ?? "").slice(0, 10),
      bedtime: s.bedtime ?? s.lights_off ?? "21:30",
      wake_time: s.wake_time ?? s.woke ?? "07:00",
      quality: s.quality ?? s.sleep_quality ?? 3,
      disturbances: s.disturbances ?? s.disturbance_count ?? 0,
      notes: s.notes ?? "",
    }));

  // ── Behaviour Support Plan ────────────────────────────────────────────
  const bspRecords = (store.behaviourSupportPlans ?? []).filter(
    (b: any) => b.child_id === childId,
  );
  let behaviour_support_plan: BehaviourSupportPlanInput | null = null;
  if (bspRecords.length > 0) {
    const sorted = [...bspRecords].sort(
      (a: any, b: any) =>
        new Date(b.last_reviewed ?? b.date ?? "").getTime() -
        new Date(a.last_reviewed ?? a.date ?? "").getTime(),
    );
    const p = sorted[0] as any;
    behaviour_support_plan = {
      id: p.id,
      status: p.status ?? "active",
      last_reviewed: (p.last_reviewed ?? p.review_date ?? p.date ?? "").slice(0, 10),
      strategies: p.strategies ?? p.de_escalation_strategies ?? [],
      triggers: p.triggers ?? p.known_triggers ?? [],
      positive_approaches: p.positive_approaches ?? p.reinforcement_strategies ?? [],
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
