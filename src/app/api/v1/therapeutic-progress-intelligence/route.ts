import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import {
  computeTherapeuticProgress,
  type TherapeuticProgressInput,
  type TherapySessionInput,
  type KeyworkSessionInput,
  type BehaviourEntryInput,
  type OutcomeTargetInput,
  type CamhsReferralInput,
  type MentalHealthCheckInInput,
  type ChildIncidentInput,
  type RestraintRecordInput,
} from "@/lib/engines/therapeutic-progress-intelligence-engine";

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

  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const child = store.youngPeople.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Unknown";
  const placementStart = (child as any).placement_start_date
    ?? (child as any).admission_date
    ?? (child as any).created_at
    ?? "2025-01-01";

  // ── Therapy Sessions ──────────────────────────────────────────────────────
  const therapySessions: TherapySessionInput[] = (store.traumaTherapyLogs ?? [])
    .filter((t: any) => t.child_id === childId)
    .map((t: any) => ({
      id: t.id,
      session_date: (t.session_date ?? "").slice(0, 10),
      modality: t.modality ?? "unknown",
      therapist_name: t.therapist_name ?? "",
      attended: t.attended !== false,
      reason_if_missed: t.reason_if_missed,
      child_presentation: t.child_presentation ?? "",
      pre_session_mood: t.pre_session_mood_rating ?? 0,
      post_session_mood: t.post_session_mood_rating ?? 0,
      escalation_flags: t.escalation_flags ?? [],
      general_theme: t.general_theme_broad ?? "",
    }));

  // ── Keywork Sessions ──────────────────────────────────────────────────────
  const keyworkSessions: KeyworkSessionInput[] = (store.keyWorkingSessions ?? [])
    .filter((k: any) => k.child_id === childId)
    .map((k: any) => ({
      id: k.id,
      date: (k.date ?? "").slice(0, 10),
      type: k.type ?? "one_to_one",
      duration: k.duration ?? 30,
      mood_before: k.mood_before ?? 0,
      mood_after: k.mood_after ?? 0,
      topics: k.topics ?? [],
      child_voice: k.child_voice ?? "",
      actions_agreed: k.actions_agreed ?? [],
      follow_up_completed: k.follow_up_completed ?? false,
    }));

  // ── Behaviour Entries ─────────────────────────────────────────────────────
  const behaviourEntries: BehaviourEntryInput[] = (store.behaviourLog ?? [])
    .filter((b: any) => b.child_id === childId)
    .map((b: any) => ({
      date: (b.date ?? "").slice(0, 10),
      type: b.type ?? b.behaviour_type ?? "verbal",
      severity: b.severity ?? b.intensity ?? "medium",
      trigger: b.trigger ?? b.antecedent ?? "",
      de_escalation_used: b.de_escalation_used ?? b.de_escalation ?? false,
      response_effective: b.response_effective ?? b.intervention_effective ?? false,
    }));

  // ── Outcome Targets ───────────────────────────────────────────────────────
  const outcomeTargets: OutcomeTargetInput[] = (store.outcomeTargets ?? [])
    .filter((t: any) => t.child_id === childId)
    .map((t: any) => ({
      id: t.id,
      domain: t.domain ?? "general",
      target: t.target ?? t.title ?? "",
      status: t.status ?? "active",
      direction: t.direction ?? "stable",
      baseline_score: t.baseline_score ?? null,
      current_score: t.current_score ?? null,
      created_at: (t.created_at ?? "").slice(0, 10),
    }));

  // ── Outcome Reviews ───────────────────────────────────────────────────────
  const outcomeReviews = (store.outcomeReviews ?? [])
    .filter((r: any) => {
      const targetIds = outcomeTargets.map((t) => t.id);
      return targetIds.includes(r.target_id);
    })
    .map((r: any) => ({
      target_id: r.target_id,
      date: (r.date ?? r.review_date ?? "").slice(0, 10),
      score: r.score ?? r.progress_score ?? 0,
      reviewer_notes: r.reviewer_notes ?? r.notes ?? "",
    }));

  // ── CAMHS Referrals ───────────────────────────────────────────────────────
  const camhsReferrals: CamhsReferralInput[] = (store.camhsReferrals ?? [])
    .filter((c: any) => c.child_id === childId)
    .map((c: any) => ({
      id: c.id,
      referral_date: (c.referral_date ?? "").slice(0, 10),
      referral_status: c.referral_status ?? "unknown",
      current_therapeutic_approach: c.current_therapeutic_approach ?? "",
      sessions_held: c.sessions_held ?? 0,
      sessions_scheduled: c.sessions_scheduled ?? 0,
      engagement_level: c.current_engagement_level ?? c.engagement_level ?? "unknown",
      waiting_time_weeks: c.waiting_time_weeks ?? 0,
    }));

  // ── Mental Health Check-Ins ───────────────────────────────────────────────
  const mentalHealthCheckIns: MentalHealthCheckInInput[] = (store.mentalHealthCheckIns ?? [])
    .filter((m: any) => m.child_id === childId)
    .map((m: any) => ({
      date: (m.date ?? m.check_date ?? "").slice(0, 10),
      overall_mood: m.overall_mood ?? m.mood_score ?? 5,
      anxiety_level: m.anxiety_level ?? m.anxiety_score ?? 0,
      sleep_quality: m.sleep_quality ?? m.sleep_score ?? 5,
      self_harm_risk: m.self_harm_risk ?? m.risk_level ?? "none",
      stressors: m.stressors ?? [],
    }));

  // ── Incidents (child-specific) ────────────────────────────────────────────
  const incidents: ChildIncidentInput[] = (store.incidents ?? [])
    .filter((i: any) => i.child_id === childId)
    .map((i: any) => ({
      date: (i.date ?? "").slice(0, 10),
      type: i.type ?? "incident",
      severity: i.severity ?? "medium",
    }));

  // ── Restraint Records ─────────────────────────────────────────────────────
  const restraintRecords: RestraintRecordInput[] = (store.restraints ?? [])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      date: (r.date ?? r.incident_date ?? "").slice(0, 10),
      duration_minutes: r.duration_minutes ?? r.duration ?? 0,
      type: r.type ?? r.restraint_type ?? "physical",
    }));

  const input: TherapeuticProgressInput = {
    today,
    child_id: childId,
    child_name: childName,
    placement_start_date: placementStart.slice(0, 10),
    therapy_sessions: therapySessions,
    keywork_sessions: keyworkSessions,
    behaviour_entries: behaviourEntries,
    outcome_targets: outcomeTargets,
    outcome_reviews: outcomeReviews,
    camhs_referrals: camhsReferrals,
    mental_health_check_ins: mentalHealthCheckIns,
    incidents,
    restraint_records: restraintRecords,
  };

  const result = computeTherapeuticProgress(input);
  return NextResponse.json({ data: result });
}
