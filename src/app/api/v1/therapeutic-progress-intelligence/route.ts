import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";
import type { CheckInSleepQuality } from "@/types/extended";
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

// CheckInSleepQuality is a declared five-point ordinal, so it maps onto the
// engine's numeric scale without inventing anything.
const SLEEP_QUALITY_SCORE: Record<CheckInSleepQuality, number> = {
  poor: 1,
  disrupted: 2,
  ok: 3,
  good: 4,
  great: 5,
};

export async function GET(request: NextRequest) {
  const childId = request.nextUrl.searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const [behaviourLogList, camhsReferralsList, incidentsList, keyWorkingSessionsList, mentalHealthCheckInsList, outcomeReviewsList, outcomeTargetsList, restraintsList, traumaTherapyLogsList, youngPeopleList] = await Promise.all([
      dal.behaviourLog.findAll(),
      dal.camhsReferrals.findAll(),
      dal.incidents.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.mentalHealthCheckIns.findAll(),
      dal.outcomeReviews.findAll(),
      dal.outcomeTargets.findAll(),
      dal.restraints.findAll(),
      dal.traumaTherapyLogs.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const today = todayStr();

  const child = youngPeopleList.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Unknown";
  const placementStart = (child as any).placement_start_date
    ?? (child as any).admission_date
    ?? (child as any).created_at
    ?? "2025-01-01";

  // ── Therapy Sessions ──────────────────────────────────────────────────────
  const therapySessions: TherapySessionInput[] = (traumaTherapyLogsList ?? [])
    .filter((t) => t.child_id === childId)
    .map((t) => ({
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
  const keyworkSessions: KeyworkSessionInput[] = (keyWorkingSessionsList ?? [])
    .filter((k) => k.child_id === childId)
    .map((k) => ({
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
  const behaviourEntries: BehaviourEntryInput[] = (behaviourLogList ?? [])
    .filter((b) => b.child_id === childId)
    .map((b) => ({
      date: (b.date ?? "").slice(0, 10),
      // `type` and `de_escalation_used` named fields BehaviourEntry does not
      // have, so every entry arrived as type "verbal" with de-escalation never
      // used — which left the engine computing its de-escalation rate over an
      // empty set for every child.
      type: b.direction,
      severity: b.intensity,
      trigger: b.trigger || b.antecedent,
      de_escalation_used: b.strategy_used.trim().length > 0,
      // BehaviourEntry records what was tried but never grades whether it
      // worked — `outcome` and `consequence` are free text. Null says
      // unmeasured; `false` used to say "it did not work", about every entry.
      response_effective: null,
    }));

  // ── Outcome Targets ───────────────────────────────────────────────────────
  const outcomeTargets: OutcomeTargetInput[] = (outcomeTargetsList ?? [])
    .filter((t) => t.child_id === childId)
    .map((t) => ({
      id: t.id,
      domain: t.domain ?? "general",
      // OutcomeTarget calls these target_description, baseline_rating and
      // current_rating. As written the target text was always "" and both
      // scores always null, so the engine's progress calculation — the whole
      // point of the outcomes section — ran over an empty list for every child.
      target: t.target_description,
      status: t.status,
      direction: t.direction,
      baseline_score: t.baseline_rating,
      current_score: t.current_rating,
      created_at: (t.created_at ?? "").slice(0, 10),
    }));

  // ── Outcome Reviews ───────────────────────────────────────────────────────
  const outcomeReviews = (outcomeReviewsList ?? [])
    .filter((r) => {
      const targetIds = outcomeTargets.map((t) => t.id);
      return targetIds.includes(r.target_id);
    })
    .map((r) => ({
      target_id: r.target_id,
      date: r.review_date.slice(0, 10),
      // OutcomeReview calls these new_rating and progress_notes; every review
      // reached the engine scored 0 with no notes.
      score: r.new_rating,
      reviewer_notes: r.progress_notes,
    }));

  // ── CAMHS Referrals ───────────────────────────────────────────────────────
  const camhsReferrals: CamhsReferralInput[] = (camhsReferralsList ?? [])
    .filter((c) => c.child_id === childId)
    .map((c) => ({
      id: c.id,
      referral_date: (c.referral_date ?? "").slice(0, 10),
      referral_status: c.referral_status ?? "unknown",
      current_therapeutic_approach: c.current_therapeutic_approach ?? "",
      sessions_held: c.sessions_held ?? 0,
      sessions_scheduled: c.sessions_scheduled ?? 0,
      engagement_level: c.current_engagement_level,
      waiting_time_weeks: c.waiting_time_weeks ?? 0,
    }));

  // ── Mental Health Check-Ins ───────────────────────────────────────────────
  const mentalHealthCheckIns: MentalHealthCheckInInput[] = (mentalHealthCheckInsList ?? [])
    .filter((m) => m.child_id === childId)
    .map((m) => ({
      // MentalHealthCheckIn has none of overall_mood, anxiety_level,
      // sleep_score, self_harm_risk or stressors. It has mood_rating (1-5),
      // sleep_quality as a five-point word, and whats_heavy — what the child
      // said was weighing on them. This collection is EMPTY today, so these
      // were latent rather than live, but `self_harm_risk: "none"` is the one
      // worth naming: it is an active claim that a child is not at risk, and
      // nothing in a check-in supports making it either way.
      date: m.date.slice(0, 10),
      overall_mood: m.mood_rating,
      anxiety_level: null,
      sleep_quality: SLEEP_QUALITY_SCORE[m.sleep_quality],
      self_harm_risk: null,
      stressors: m.whats_heavy ? [m.whats_heavy] : [],
    }));

  // ── Incidents (child-specific) ────────────────────────────────────────────
  const incidents: ChildIncidentInput[] = (incidentsList ?? [])
    .filter((i) => i.child_id === childId)
    .map((i) => ({
      date: (i.date ?? "").slice(0, 10),
      type: i.type ?? "incident",
      severity: i.severity ?? "medium",
    }));

  // ── Restraint Records ─────────────────────────────────────────────────────
  const restraintRecords: RestraintRecordInput[] = (restraintsList ?? [])
    .filter((r) => r.child_id === childId)
    .map((r) => ({
      // `date` and `duration` were already the live operands here; only the
      // dead names beside them go.
      date: r.date.slice(0, 10),
      duration_minutes: r.duration,
      type: r.restraint_type,
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
